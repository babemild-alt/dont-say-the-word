import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

// Token endpoint for Ably client-side authentication
export async function GET(req: NextRequest) {
    const clientId = req.nextUrl.searchParams.get('clientId');
    const roomCode = req.nextUrl.searchParams.get('roomCode');

    if (!clientId || !roomCode) {
        return NextResponse.json({ error: 'clientId and roomCode required' }, { status: 400 });
    }

    const tokenRequest = await ably.auth.createTokenRequest({
        clientId,
        capability: { [`room:${roomCode.toUpperCase()}`]: ['subscribe', 'publish', 'presence'] },
    });

    return NextResponse.json(tokenRequest);
}
