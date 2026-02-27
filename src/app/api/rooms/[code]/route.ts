import { NextRequest, NextResponse } from 'next/server';
import { getRoom, startGame, eliminatePlayer } from '@/lib/roomStore';
import { assignWords } from '@/lib/wordList';
import Ably from 'ably';

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

// GET room state
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const room = await getRoom(code);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json({ room });
}

// POST actions: start | catch | honk
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const body = await req.json();
    const { action, playerId } = body;

    const room = await getRoom(code);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const channel = ably.channels.get(`room:${code.toUpperCase()}`);

    if (action === 'start') {
        if (room.hostId !== playerId) {
            return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
        }
        if (Object.keys(room.players).length < 2) {
            return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 });
        }

        const playerIds = Object.keys(room.players);
        const words = assignWords(playerIds);
        const updatedRoom = await startGame(code, words);

        await channel.publish('game-started', { room: updatedRoom });
        return NextResponse.json({ room: updatedRoom });
    }

    if (action === 'catch') {
        const { targetId, catcherId } = body;
        if (!targetId || !catcherId) {
            return NextResponse.json({ error: 'Missing targetId or catcherId' }, { status: 400 });
        }
        if (room.status !== 'playing') {
            return NextResponse.json({ error: 'Game not in progress' }, { status: 400 });
        }
        const target = room.players[targetId];
        if (!target || target.isEliminated) {
            return NextResponse.json({ error: 'Player not found or already eliminated' }, { status: 400 });
        }

        const updatedRoom = await eliminatePlayer(code, targetId);
        const activePlayers = Object.values(updatedRoom!.players).filter(p => !p.isEliminated);
        const gameEnded = activePlayers.length <= 1;

        await channel.publish('player-caught', {
            room: updatedRoom,
            targetId,
            catcherId,
            gameEnded,
            winner: gameEnded ? activePlayers[0]?.id : null,
        });

        return NextResponse.json({ room: updatedRoom, gameEnded, winner: activePlayers[0]?.id });
    }

    if (action === 'honk') {
        const { honkerId } = body;
        await channel.publish('honk', { honkerId });
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
