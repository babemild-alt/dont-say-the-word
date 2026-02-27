import { Room } from './types';

// Store rooms on the global object so they survive Next.js HMR hot reloads in dev
// and persist correctly within a single Vercel serverless function instance
declare global {
    // eslint-disable-next-line no-var
    var __roomStore: Map<string, Room> | undefined;
}

if (!global.__roomStore) {
    global.__roomStore = new Map<string, Room>();
}

const rooms = global.__roomStore;

// Clean up rooms older than 4 hours
const ROOM_TTL = 4 * 60 * 60 * 1000;

function cleanup() {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
        if (now - room.createdAt > ROOM_TTL) {
            rooms.delete(code);
        }
    }
}

export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

export function createRoom(hostId: string, hostName: string): Room {
    cleanup();
    const code = generateRoomCode();
    const room: Room = {
        code,
        status: 'lobby',
        hostId,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                isHost: true,
                isEliminated: false,
                joinedAt: Date.now(),
            },
        },
        words: {},
        createdAt: Date.now(),
    };
    rooms.set(code, room);
    return room;
}

export function getRoom(code: string): Room | undefined {
    return rooms.get(code.toUpperCase());
}

export function updateRoom(code: string, updater: (room: Room) => Room): Room | null {
    const room = rooms.get(code.toUpperCase());
    if (!room) return null;
    const updated = updater({ ...room, players: { ...room.players }, words: { ...room.words } });
    rooms.set(code.toUpperCase(), updated);
    return updated;
}

export function addPlayer(code: string, playerId: string, playerName: string): Room | null {
    return updateRoom(code, (room) => ({
        ...room,
        players: {
            ...room.players,
            [playerId]: {
                id: playerId,
                name: playerName,
                isHost: false,
                isEliminated: false,
                joinedAt: Date.now(),
            },
        },
    }));
}

export function eliminatePlayer(code: string, targetId: string): Room | null {
    return updateRoom(code, (room) => ({
        ...room,
        players: {
            ...room.players,
            [targetId]: {
                ...room.players[targetId],
                isEliminated: true,
            },
        },
    }));
}

export function startGame(code: string, words: Record<string, string>): Room | null {
    return updateRoom(code, (room) => ({
        ...room,
        status: 'playing',
        words,
    }));
}
