import { NextRequest, NextResponse } from 'next/server';
import { getRoom, addPlayer } from '@/lib/roomStore';
import Ably from 'ably';
import { v4 as uuidv4 } from 'uuid';

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { roomCode, playerName } = await req.json();
        if (!roomCode?.trim() || !playerName?.trim()) {
            return NextResponse.json({ error: 'Room code and player name are required' }, { status: 400 });
        }

        const code = roomCode.trim().toUpperCase();
        const room = getRoom(code);
        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
        if (room.status !== 'lobby') {
            return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
        }
        if (Object.keys(room.players).length >= 20) {
            return NextResponse.json({ error: 'Room is full (max 20 players)' }, { status: 400 });
        }

        const playerId = uuidv4();
        const updatedRoom = addPlayer(code, playerId, playerName.trim());

        const tokenRequest = await ably.auth.createTokenRequest({
            clientId: playerId,
            capability: { [`room:${code}`]: ['subscribe', 'publish', 'presence'] },
        });

        return NextResponse.json({ room: updatedRoom, playerId, tokenRequest });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
