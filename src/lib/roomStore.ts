import { Redis } from '@upstash/redis';
import { Room } from './types';

// Upstash Redis client — works on Vercel serverless and edge functions
// Falls back gracefully for local dev if env vars aren't set
let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
        }
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    return redis;
}

const ROOM_TTL_SECONDS = 4 * 60 * 60; // 4 hours
const roomKey = (code: string) => `room:${code.toUpperCase()}`;

export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function createRoom(hostId: string, hostName: string): Promise<Room> {
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
    await getRedis().set(roomKey(code), JSON.stringify(room), { ex: ROOM_TTL_SECONDS });
    return room;
}

export async function getRoom(code: string): Promise<Room | null> {
    const data = await getRedis().get<string>(roomKey(code));
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data as Room;
}

export async function updateRoom(code: string, updater: (room: Room) => Room): Promise<Room | null> {
    const room = await getRoom(code);
    if (!room) return null;
    const updated = updater({ ...room, players: { ...room.players }, words: { ...room.words } });
    await getRedis().set(roomKey(code), JSON.stringify(updated), { ex: ROOM_TTL_SECONDS });
    return updated;
}

export async function addPlayer(code: string, playerId: string, playerName: string): Promise<Room | null> {
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

export async function eliminatePlayer(code: string, targetId: string): Promise<Room | null> {
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

export async function startGame(code: string, words: Record<string, string>): Promise<Room | null> {
    return updateRoom(code, (room) => ({
        ...room,
        status: 'playing',
        words,
    }));
}
