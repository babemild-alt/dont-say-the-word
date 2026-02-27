'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import { Room } from '@/lib/types';

export default function LobbyPage() {
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [room, setRoom] = useState<Room | null>(null);
    const [playerId, setPlayerId] = useState('');
    const [starting, setStarting] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchRoom = useCallback(async () => {
        const res = await fetch(`/api/rooms/${code}`);
        if (res.ok) {
            const data = await res.json();
            setRoom(data.room);
        }
    }, [code]);

    useEffect(() => {
        const pid = sessionStorage.getItem('playerId');
        const tokenStr = sessionStorage.getItem('tokenRequest');
        if (!pid || !tokenStr) { router.push('/'); return; }
        setPlayerId(pid);

        fetchRoom();

        // Connect to Ably
        const tokenRequest = JSON.parse(tokenStr);
        const client = new Ably.Realtime({
            authCallback: (_data, callback) => {
                callback(null, tokenRequest as Ably.TokenRequest);
            },
            clientId: pid,
        });

        const channel = client.channels.get(`room:${code}`);

        channel.subscribe('player-joined', (msg) => {
            setRoom(msg.data.room);
        });

        channel.subscribe('game-started', (msg) => {
            setRoom(msg.data.room);
            setTimeout(() => router.push(`/room/${code}/game`), 300);
        });

        // Also subscribe to presence to catch new joins
        channel.presence.subscribe(() => { fetchRoom(); });

        // Announce presence
        channel.presence.enter({ name: sessionStorage.getItem('playerName') });


        return () => { channel.detach(); client.close(); };
    }, [code, fetchRoom, router]);

    // Poll room state every 3s as a fallback
    useEffect(() => {
        const interval = setInterval(fetchRoom, 3000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    const handleStart = async () => {
        setStarting(true);
        const res = await fetch(`/api/rooms/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start', playerId }),
        });
        if (res.ok) {
            router.push(`/room/${code}/game`);
        } else {
            const data = await res.json();
            alert(data.error);
            setStarting(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const players = room ? Object.values(room.players) : [];
    const isHost = room?.hostId === playerId;

    return (
        <div className="min-h-screen flex flex-col px-5 py-8 max-w-sm mx-auto">
            {/* Background */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(255,45,120,0.1) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div className="relative z-10 flex flex-col flex-1">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-white/50 text-sm mb-2">รหัสห้อง</p>
                    <button
                        id="btn-copy-code"
                        onClick={copyCode}
                        className="room-code block w-full text-center active:scale-95 transition-transform"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        {code}
                    </button>
                    <p className="text-white/40 text-xs mt-1">
                        {copied ? '✅ คัดลอกแล้ว!' : 'แตะเพื่อคัดลอก'}
                    </p>
                    <p className="text-white/50 text-sm mt-3">
                        แชร์รหัสนี้ให้เพื่อนๆ เข้าร่วม
                    </p>
                </div>

                {/* Player list */}
                <div className="glass-card p-4 mb-6 flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">ผู้เล่น</h2>
                        <span
                            className="text-sm px-3 py-1 rounded-full font-bold"
                            style={{ background: 'rgba(255,45,120,0.2)', color: '#ff2d78' }}
                        >
                            {players.length}/20
                        </span>
                    </div>
                    <div className="space-y-2">
                        {players.length === 0 && (
                            <p className="text-white/30 text-center py-6">รอผู้เล่น...</p>
                        )}
                        {players.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                                    style={{
                                        background: p.isHost
                                            ? 'linear-gradient(135deg, #ffe600, #ff9500)'
                                            : 'linear-gradient(135deg, #7c3aed, #ff2d78)',
                                        color: '#fff',
                                    }}
                                >
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium flex-1">{p.name}</span>
                                <div className="flex gap-1">
                                    {p.isHost && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,230,0,0.2)', color: '#ffe600' }}>
                                            👑 เจ้าของห้อง
                                        </span>
                                    )}
                                    {p.id === playerId && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                                            คุณ
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action */}
                {isHost ? (
                    <div>
                        {players.length < 2 && (
                            <p className="text-white/40 text-sm text-center mb-3">ต้องมีผู้เล่นอย่างน้อย 2 คน</p>
                        )}
                        <button
                            id="btn-start-game"
                            className="btn-primary"
                            onClick={handleStart}
                            disabled={players.length < 2 || starting}
                            style={players.length < 2 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                            {starting ? '⏳ กำลังเริ่ม...' : '🎮 เริ่มเกม!'}
                        </button>
                    </div>
                ) : (
                    <div
                        className="text-center py-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="text-2xl mb-2" style={{ animation: 'float 2s ease-in-out infinite' }}>⏳</div>
                        <p className="text-white/60 text-sm">รอเจ้าของห้องเริ่มเกม...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
