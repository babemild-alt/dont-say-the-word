export type GameStatus = 'lobby' | 'playing' | 'ended';

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    isEliminated: boolean;
    joinedAt: number;
}

export interface Room {
    code: string;
    status: GameStatus;
    players: Record<string, Player>;
    words: Record<string, string>; // playerId -> word
    createdAt: number;
    hostId: string;
}

export interface JoinRoomResult {
    room: Room;
    playerId: string;
    ablyToken: string;
}
