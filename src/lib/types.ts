export type GameStatus = "waiting" | "playing" | "finished";

export interface Game {
    id: string;
    code: string;
    created_at: string;
    status: GameStatus;
    current_turn: number;
    presentation_chain_index?: number | null;
    presentation_step_index?: number | null;
}

export interface Player {
    id: string;
    game_id: string;
    name: string;
    order_index: number | null;
    is_admin: boolean;
    created_at: string;
}

export interface GameItem {
    id: string;
    game_id: string;
    chain_index: number;
    turn: number;
    player_id: string | null;
    type: "word" | "drawing";
    content: string | null;
    completed: boolean;
    created_at: string;
}
