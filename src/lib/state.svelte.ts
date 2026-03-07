import { supabase } from "./supabase";
import type { Game, Player, GameItem } from "./types";

export const state = $state({
    game: null as Game | null,
    me: null as Player | null,
    players: [] as Player[],
    items: [] as GameItem[],

    // local states
    isLoading: false,
    error: null as string | null
});

// A simple local storage helper for reconnecting
const STORAGE_PLAYER_KEY = 'interferencias_player_id';
const STORAGE_GAME_KEY = 'interferencias_game_id';

export function saveLocalSession(gameId: string, playerId: string) {
    localStorage.setItem(STORAGE_GAME_KEY, gameId);
    localStorage.setItem(STORAGE_PLAYER_KEY, playerId);
}

export function loadLocalSession() {
    return {
        gameId: localStorage.getItem(STORAGE_GAME_KEY),
        playerId: localStorage.getItem(STORAGE_PLAYER_KEY)
    };
}

export function clearLocalSession() {
    localStorage.removeItem(STORAGE_GAME_KEY);
    localStorage.removeItem(STORAGE_PLAYER_KEY);
}
