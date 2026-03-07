import { supabase } from "./supabase";
import type { Game, Player, GameItem } from "./types";
import { RealtimeChannel } from "@supabase/supabase-js";

export const secretWords = ["Un perro volador", "Alien comiendo pizza", "Un dinosaurio en monopatín", "Gato astronauta", "Robot triste", "Fantasma asustado", "Helado derretido al sol", "Tiburón nadando en café", "Pájaro con gafas de sol", "Coche de caballos espacial"];

export class GameState {
    game = $state<Game | null>(null);
    me = $state<Player | null>(null);
    players = $state<Player[]>([]);
    items = $state<GameItem[]>([]);
    isLoading = $state(false);
    error = $state<string | null>(null);

    private channel: RealtimeChannel | null = null;
    private itemsChannel: RealtimeChannel | null = null;

    async createGame(playerName: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const shortCode = Math.floor(1000 + Math.random() * 9000).toString();
            const { data: game, error: gameError } = await supabase
                .from('interferencias_games')
                .insert({ status: 'waiting', current_turn: 0, code: shortCode })
                .select('*')
                .single();

            if (gameError) throw gameError;

            const { data: player, error: playerError } = await supabase
                .from('interferencias_players')
                .insert({
                    game_id: game.id,
                    name: playerName,
                    is_admin: true,
                    order_index: 0
                })
                .select('*')
                .single();

            if (playerError) throw playerError;

            this.game = game;
            this.me = player;
            this.players = [player];

            this.saveSession();
            this.subscribe();
        } catch (err: any) {
            this.error = err.message;
        } finally {
            this.isLoading = false;
        }
    }

    async joinGame(gameCode: string, playerName: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const { data: game, error: gameError } = await supabase
                .from('interferencias_games')
                .select('*')
                .eq('code', gameCode)
                .single();

            if (gameError || !game) throw new Error("Partida no encontrada");
            if (game.status !== 'waiting') throw new Error("La partida ya ha comenzado");

            const { data: player, error: playerError } = await supabase
                .from('interferencias_players')
                .insert({
                    game_id: game.id,
                    name: playerName,
                    is_admin: false
                })
                .select('*')
                .single();

            if (playerError) throw playerError;

            this.game = game;
            this.me = player;

            await this.fetchPlayers();

            this.saveSession();
            this.subscribe();
        } catch (err: any) {
            this.error = err.message;
        } finally {
            this.isLoading = false;
        }
    }

    async fetchPlayers() {
        if (!this.game) return;
        const { data: players, error } = await supabase
            .from('interferencias_players')
            .select('*')
            .eq('game_id', this.game.id)
            .order('created_at', { ascending: true });

        if (!error && players) {
            this.players = players;
        }
    }

    async fetchItems() {
        if (!this.game) return;
        const { data, error } = await supabase
            .from('interferencias_items')
            .select('*')
            .eq('game_id', this.game.id);

        if (!error && data) {
            this.items = data;
        }
    }

    async resumeSession(gameId: string, playerId: string) {
        this.isLoading = true;
        try {
            const { data: game, error: gameError } = await supabase.from('interferencias_games').select('*').eq('id', gameId).single();
            const { data: player, error: playerError } = await supabase.from('interferencias_players').select('*').eq('id', playerId).single();

            if (game && player && !gameError && !playerError) {
                this.game = game;
                this.me = player;
                await this.fetchPlayers();
                await this.fetchItems();
                this.subscribe();
            } else {
                this.clearSession();
            }
        } catch (e) {
            this.clearSession();
        } finally {
            this.isLoading = false;
        }
    }

    async updatePlayersOrder(newPlayers: Player[]) {
        if (!this.me?.is_admin || !this.game) return;
        // Optimistic update
        this.players = newPlayers;
        for (let i = 0; i < newPlayers.length; i++) {
            await supabase.from('interferencias_players')
                .update({ order_index: i })
                .eq('id', newPlayers[i].id);
        }
    }

    async kickPlayer(playerId: string) {
        if (!this.me?.is_admin || !this.game) return;

        try {
            await supabase.from('interferencias_players').delete().eq('id', playerId);
            this.players = this.players.filter(p => p.id !== playerId);
        } catch (e) {
            console.error(e);
        }
    }

    async startGame() {
        if (!this.me?.is_admin || !this.game) return;
        this.isLoading = true;

        try {
            const N = this.players.length;
            // Ensure all players have an order_index
            const orderedPlayers = [...this.players].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
            this.players = orderedPlayers.map((p, i) => ({ ...p, order_index: i }));
            await this.updatePlayersOrder(this.players);

            const initialItems: any[] = [];

            for (let i = 0; i < N; i++) {
                const randomWord = secretWords[Math.floor(Math.random() * secretWords.length)];
                const player = this.players.find(p => p.order_index === i)!;

                initialItems.push({
                    game_id: this.game.id,
                    chain_index: i,
                    turn: 0,
                    player_id: player.id,
                    type: 'word',
                    content: randomWord,
                    completed: true
                });

                for (let T = 1; T <= N; T++) {
                    const authorIndex = (i + T) % N;
                    const authPlayer = this.players.find(p => p.order_index === authorIndex);
                    initialItems.push({
                        game_id: this.game.id,
                        chain_index: i,
                        turn: T,
                        player_id: authPlayer?.id || null, // Will use authPlayer if found
                        type: T % 2 === 1 ? 'drawing' : 'word',
                        content: null,
                        completed: false
                    });
                }
            }

            await supabase.from('interferencias_items').insert(initialItems);

            await supabase.from('interferencias_games').update({
                status: 'playing',
                current_turn: 1
            }).eq('id', this.game.id);

        } catch (e: any) {
            this.error = e.message;
        } finally {
            this.isLoading = false;
        }
    }

    async submitTurn(itemId: string, content: string) {
        if (!this.game) return;

        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            this.items[idx].content = content;
            this.items[idx].completed = true;
        }

        await supabase.from('interferencias_items')
            .update({ content, completed: true })
            .eq('id', itemId);
    }

    async nextTurn() {
        if (!this.me?.is_admin || !this.game) return;
        const N = this.players.length;
        const nextTurn = this.game.current_turn + 1;
        const status = nextTurn > N ? 'finished' : 'playing';

        await supabase.from('interferencias_games')
            .update({ current_turn: nextTurn, status })
            .eq('id', this.game.id);
    }

    async setPresentation(chainIndex: number | null, stepIndex: number | null) {
        if (!this.me?.is_admin || !this.game) return;

        await supabase.from('interferencias_games')
            .update({
                presentation_chain_index: chainIndex,
                presentation_step_index: stepIndex
            })
            .eq('id', this.game.id);
    }

    async changeInitialWord(itemId: string) {
        if (!this.game) return;
        const randomWord = secretWords[Math.floor(Math.random() * secretWords.length)];
        await supabase.from('interferencias_items')
            .update({ content: randomWord })
            .eq('id', itemId);
    }

    subscribe() {
        if (this.channel) this.channel.unsubscribe();
        if (!this.game) return;

        this.channel = supabase.channel(`game_${this.game.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interferencias_games', filter: `id=eq.${this.game.id}` }, payload => {
                this.game = payload.new as Game;
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interferencias_players', filter: `game_id=eq.${this.game.id}` }, payload => {
                if (payload.eventType === 'INSERT') {
                    this.players.push(payload.new as Player);
                } else if (payload.eventType === 'UPDATE') {
                    const idx = this.players.findIndex(p => p.id === payload.new.id);
                    if (idx !== -1) this.players[idx] = payload.new as Player;
                }
            })
            .subscribe();

        this.itemsChannel = supabase.channel(`items_${this.game.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interferencias_items', filter: `game_id=eq.${this.game.id}` }, payload => {
                const newItem = payload.new as GameItem;
                if (payload.eventType === 'INSERT') {
                    if (!this.items.find(i => i.id === newItem.id)) {
                        this.items.push(newItem);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const idx = this.items.findIndex(i => i.id === newItem.id);
                    if (idx >= 0) this.items[idx] = newItem;
                }
            })
            .subscribe();
    }

    private saveSession() {
        if (this.game && this.me) {
            localStorage.setItem('interferencias_game_id', this.game.id);
            localStorage.setItem('interferencias_player_id', this.me.id);
        }
    }

    private clearSession() {
        localStorage.removeItem('interferencias_game_id');
        localStorage.removeItem('interferencias_player_id');
        this.game = null;
        this.me = null;
    }

    leave() {
        this.clearSession();
        if (this.channel) this.channel.unsubscribe();
        if (this.itemsChannel) this.itemsChannel.unsubscribe();
    }
}

export const gameState = new GameState();
