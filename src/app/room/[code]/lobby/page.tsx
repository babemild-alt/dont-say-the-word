'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import { Room } from '@/lib/types';

const AVATAR_COLORS = ['avatar-0', 'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7'];

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
        channel.subscribe('game-started', (msg) => { setRoom(msg.data.room); setTimeout(() => router.push(`/room/${code}/game`), 200); });
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
        if (res.ok) router.push(`/room/${code}/game`);
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
        <div className="min-h-dvh flex flex-col px-5 py-6 max-w-sm mx-auto relative overflow-hidden">
            <div className="fun-bg"><div className="shape" /><div className="shape" /><div className="shape" /><div className="shape" /></div>

            <div className="relative z-10 flex flex-col flex-1">
                {/* Room Code */}
                <div className="text-center mb-6 pop-in">
                    <p className="section-label mb-1">รหัสห้อง — แชร์ให้เพื่อน!</p>
                    <button onClick={copyCode} className="room-code block w-full text-center"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {code}
                    </button>
                    <p className="text-xs font-bold mt-1" style={{ color: copied ? 'var(--green-deep)' : 'var(--text-tertiary)' }}>
                        {copied ? '✅ คัดลอกแล้ว!' : '👆 แตะเพื่อคัดลอก'}
                    </p>
                </div>

                {/* Player List */}
                <div className="card-elevated p-5 mb-5 flex-1 slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-extrabold text-base">ผู้เล่นในห้อง</h2>
                        <span className="badge badge-active">{players.length} คน</span>
                    </div>

                    {players.length === 0 && (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-2 float">👥</div>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 600 }}>รอผู้เล่น...</p>
                        </div>
                    )}

                    <div className="space-y-2 stagger-children">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                                style={{ background: 'var(--bg-surface)' }}>
                                <div className={`avatar avatar-sm ${p.isHost ? 'avatar-host' : AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold flex-1 text-sm truncate">{p.name}</span>
                                <div className="flex gap-1.5">
                                    {p.isHost && <span className="badge badge-host">👑 Host</span>}
                                    {p.id === playerId && <span className="badge badge-you">คุณ</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="slide-up" style={{ animationDelay: '200ms' }}>
                    {isHost ? (
                        <div>
                            {players.length < 2 && (
                                <p className="text-xs text-center mb-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                                    ต้องมีอย่างน้อย 2 คนจึงจะเริ่มได้
                                </p>
                            )}
                            <button className="btn-primary" onClick={handleStart} disabled={players.length < 2 || starting}>
                                {starting ? '⏳ กำลังเริ่ม...' : '🎮 เริ่มเกม!'}
                            </button>
                        </div>
                    ) : (
                        <div className="card-yellow p-5 text-center">
                            <div className="text-3xl mb-1 float" style={{ animationDuration: '2s' }}>⏳</div>
                            <p className="font-bold text-sm" style={{ color: 'var(--text-on-yellow)' }}>รอเจ้าของห้องเริ่มเกม...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
