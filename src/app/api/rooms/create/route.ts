import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';
import Ably from 'ably';
import { v4 as uuidv4 } from 'uuid';

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { playerName } = await req.json();
        if (!playerName?.trim()) {
            return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
        }

        const playerId = uuidv4();
        const room = await createRoom(playerId, playerName.trim());

        const tokenRequest = await ably.auth.createTokenRequest({
            clientId: playerId,
            capability: { [`room:${room.code}`]: ['subscribe', 'publish', 'presence'] },
        });

        return NextResponse.json({ room, playerId, tokenRequest });
    } catch (e) {
        console.error('[create]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
