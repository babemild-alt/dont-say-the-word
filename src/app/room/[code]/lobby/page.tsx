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
        if (res.ok) { const data = await res.json(); setRoom(data.room); }
    }, [code]);

    useEffect(() => {
        const pid = sessionStorage.getItem('playerId');
        const tokenStr = sessionStorage.getItem('tokenRequest');
        if (!pid || !tokenStr) { router.push('/'); return; }
        setPlayerId(pid);
        fetchRoom();

        const tokenRequest = JSON.parse(tokenStr);
        const client = new Ably.Realtime({
            authCallback: (_data, callback) => { callback(null, tokenRequest as Ably.TokenRequest); },
            clientId: pid,
        });
        const channel = client.channels.get(`room:${code}`);
        channel.subscribe('player-joined', (msg) => setRoom(msg.data.room));
        channel.subscribe('game-started', (msg) => { setRoom(msg.data.room); setTimeout(() => router.push(`/room/${code}/game`), 300); });
        channel.presence.subscribe(() => fetchRoom());
        channel.presence.enter({ name: sessionStorage.getItem('playerName') });
        return () => { channel.detach(); client.close(); };
    }, [code, fetchRoom, router]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await fetch(`/api/rooms/${code}`);
            if (res.ok) {
                const data = await res.json();
                setRoom(data.room);
                if (data.room.status === 'playing') router.push(`/room/${code}/game`);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [code, router]);

    const handleStart = async () => {
        setStarting(true);
        const res = await fetch(`/api/rooms/${code}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start', playerId }),
        });
        if (res.ok) { router.push(`/room/${code}/game`); }
        else { const data = await res.json(); alert(data.error); setStarting(false); }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const players = room ? Object.values(room.players) : [];
    const isHost = room?.hostId === playerId;

    return (
        <div className="min-h-dvh flex flex-col px-5 py-6 max-w-sm mx-auto relative">
            <div className="ambient-bg">
                <div className="ambient-blob" />
                <div className="ambient-blob" />
                <div className="ambient-blob" />
            </div>

            <div className="relative z-10 flex flex-col flex-1">
                {/* Room Code */}
                <div className="text-center mb-8 pop-in">
                    <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        รหัสห้อง
                    </p>
                    <button id="btn-copy-code" onClick={copyCode} className="room-code block w-full text-center"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {code}
                    </button>
                    <p className="text-xs mt-2" style={{ color: copied ? 'var(--green)' : 'var(--text-tertiary)' }}>
                        {copied ? '✅ คัดลอกแล้ว!' : 'แตะเพื่อคัดลอกรหัส'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        ส่งรหัสนี้ให้เพื่อนๆ เข้าร่วมเกม
                    </p>
                </div>

                {/* Player List */}
                <div className="glass-elevated p-5 mb-5 flex-1 slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-base">ผู้เล่น</h2>
                        <span className="badge badge-catch" style={{ fontSize: '0.7rem' }}>
                            {players.length} / 20
                        </span>
                    </div>

                    <div className="space-y-2 stagger-children">
                        {players.length === 0 && (
                            <p className="text-center py-8" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                รอผู้เล่น...
                            </p>
                        )}
                        {players.map((p) => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                                style={{ background: 'var(--surface)' }}>
                                <div className={`avatar avatar-sm ${p.isHost ? 'avatar-host' : 'avatar-player'}`}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium flex-1 text-sm truncate">{p.name}</span>
                                <div className="flex gap-1.5">
                                    {p.isHost && <span className="badge badge-host">👑 Host</span>}
                                    {p.id === playerId && <span className="badge badge-you">คุณ</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Start or Wait */}
                <div className="slide-up" style={{ animationDelay: '200ms' }}>
                    {isHost ? (
                        <div>
                            {players.length < 2 && (
                                <p className="text-xs text-center mb-3" style={{ color: 'var(--text-tertiary)' }}>
                                    ต้องมีผู้เล่นอย่างน้อย 2 คน
                                </p>
                            )}
                            <button id="btn-start-game" className="btn-primary" onClick={handleStart}
                                disabled={players.length < 2 || starting}>
                                {starting ? '⏳ กำลังเริ่ม...' : '🎮 เริ่มเกม!'}
                            </button>
                        </div>
                    ) : (
                        <div className="glass p-5 text-center">
                            <div className="text-2xl mb-2 float" style={{ animationDuration: '2s' }}>⏳</div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>รอเจ้าของห้องเริ่มเกม...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
