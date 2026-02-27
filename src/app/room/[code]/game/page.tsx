'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import { Room, Player } from '@/lib/types';

export default function GamePage() {
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [room, setRoom] = useState<Room | null>(null);
    const [playerId, setPlayerId] = useState('');
    const [honkAnimating, setHonkAnimating] = useState(false);
    const [honkFlash, setHonkFlash] = useState(false);
    const [catchTarget, setCatchTarget] = useState<Player | null>(null);
    const [catching, setCatching] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [eliminated, setEliminated] = useState(false);
    const ablyRef = useRef<Ably.Realtime | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

    const playHonk = useCallback(() => {
        try {
            if (!audioRef.current) {
                audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            }
            const ctx = audioRef.current;
            // Generate a honk sound using Web Audio API
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(180, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);
            oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch { /* ignore audio errors */ }
    }, []);

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

        const tokenRequest = JSON.parse(tokenStr);
        const client = new Ably.Realtime({
            authCallback: (_data, callback) => {
                callback(null, tokenRequest as Ably.TokenRequest);
            },
            clientId: pid,
        });

        const channel = client.channels.get(`room:${code}`);

        channel.subscribe('player-caught', (msg) => {
            setRoom(msg.data.room);
            if (msg.data.targetId === pid) {
                setEliminated(true);
            }
            if (msg.data.gameEnded) {
                setWinner(msg.data.winner);
            }
        });

        channel.subscribe('honk', () => {
            playHonk();
            setHonkFlash(true);
            setTimeout(() => setHonkFlash(false), 600);
        });

        channel.subscribe('game-started', (msg) => {
            setRoom(msg.data.room);
        });

        ablyRef.current = client;

        return () => { channel.detach(); client.close(); };
    }, [code, fetchRoom, playHonk, router]);

    // Polling fallback
    useEffect(() => {
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    const handleHonk = async () => {
        if (honkAnimating) return;
        setHonkAnimating(true);
        playHonk();
        setTimeout(() => setHonkAnimating(false), 400);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'honk', honkerId: playerId }),
        });
    };

    const handleCatch = async () => {
        if (!catchTarget || catching) return;
        setCatching(true);
        const res = await fetch(`/api/rooms/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'catch', catcherId: playerId, targetId: catchTarget.id }),
        });
        const data = await res.json();
        setRoom(data.room);
        if (data.gameEnded) setWinner(data.winner);
        setCatchTarget(null);
        setCatching(false);
    };

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4" style={{ animation: 'float 1.5s ease-in-out infinite' }}>🎮</div>
                    <p className="text-white/50">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const players = Object.values(room.players);
    const myWord = room.words[playerId];
    const otherPlayers = players.filter(p => p.id !== playerId);
    const myPlayer = room.players[playerId];
    const isGameOver = !!winner;
    const winnerPlayer = winner ? room.players[winner] : null;

    // Game over screen
    if (isGameOver) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center">
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(255,230,0,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div className="relative z-10 pop-in">
                    <div className="text-8xl mb-6">🏆</div>
                    <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.05em', color: '#ffe600', textShadow: '0 0 30px rgba(255,230,0,0.7)' }}>
                        เกมจบแล้ว!
                    </h1>
                    <p className="text-white/60 mb-2">ผู้รอดชีวิตคนสุดท้าย</p>
                    <p className="text-3xl font-bold text-white mb-8">{winnerPlayer?.name ?? 'ไม่ทราบ'}</p>

                    <div className="glass-card p-4 mb-6 text-left">
                        <p className="text-white/50 text-sm mb-3 text-center">คำศัพท์ต้องห้ามทั้งหมด</p>
                        {players.map(p => (
                            <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                <span className="text-white/80 flex items-center gap-2">
                                    {p.isEliminated ? '❌' : '✅'} {p.name}
                                </span>
                                <span className="font-bold" style={{ color: '#ff2d78' }}>
                                    {room.words[p.id]}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button id="btn-play-again" className="btn-primary" onClick={() => router.push('/')}>
                        🎮 เล่นใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    // Eliminated screen
    if (eliminated || myPlayer?.isEliminated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(255,45,120,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div className="relative z-10 pop-in">
                    <div className="text-8xl mb-4">😱</div>
                    <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.05em', color: '#ff2d78', textShadow: '0 0 30px rgba(255,45,120,0.7)' }}>
                        โดนจับได้แล้ว!
                    </h1>
                    <p className="text-white/60 mb-4">คุณพูดคำต้องห้าม</p>
                    {myWord && (
                        <div className="glass-card px-8 py-5 mb-6 inline-block">
                            <p className="text-white/50 text-sm mb-1">คำต้องห้ามของคุณคือ</p>
                            <p className="text-4xl font-bold" style={{ color: '#ff2d78', fontFamily: 'Noto Sans Thai, sans-serif' }}>{myWord}</p>
                        </div>
                    )}
                    <p className="text-white/40 text-sm italic mb-8">ดูผู้เล่นที่เหลือต่อสู้กันต่อได้เลย 👀</p>
                    {/* Show remaining active players */}
                    <div className="glass-card p-4 text-left w-full max-w-xs">
                        <p className="text-white/50 text-sm mb-2 text-center">ผู้เล่นที่เหลือ</p>
                        {players.filter(p => !p.isEliminated && p.id !== playerId).map(p => (
                            <div key={p.id} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                <span>{p.name}</span>
                                <span style={{ color: '#ff2d78' }}>{room.words[p.id]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col max-w-sm mx-auto"
            style={{
                transition: 'background 0.3s',
                background: honkFlash ? 'rgba(255,230,0,0.07)' : undefined,
            }}
        >
            {/* Top bar */}
            <div className="px-4 pt-6 pb-3 flex justify-between items-center">
                <div>
                    <p className="text-white/40 text-xs">ห้อง</p>
                    <p className="font-bold text-lg" style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.15em', color: '#ffe600' }}>{code}</p>
                </div>
                <div className="text-right">
                    <p className="text-white/40 text-xs">ผู้เล่น</p>
                    <p className="font-bold text-lg">
                        {players.filter(p => !p.isEliminated).length}/{players.length}
                    </p>
                </div>
            </div>

            {/* My secret word banner */}
            <div
                className="mx-4 mb-4 p-4 rounded-2xl text-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,45,120,0.15), rgba(124,58,237,0.15))',
                    border: '1.5px solid rgba(255,45,120,0.3)',
                }}
            >
                <p className="text-white/60 text-xs mb-1">🤫 คำต้องห้ามของคุณ (อย่าพูดคำนี้!)</p>
                <div className="flex items-center justify-center gap-2">
                    <div
                        className="px-5 py-2 rounded-xl font-bold text-2xl"
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            letterSpacing: '0.25em',
                            color: 'rgba(255,255,255,0.15)',
                            fontFamily: 'Noto Sans Thai, sans-serif',
                            filter: 'blur(5px)',
                            userSelect: 'none',
                        }}
                    >
                        ????????
                    </div>
                </div>
                <p className="text-white/30 text-xs mt-2">ซ่อนอยู่ — ระวังอย่าพูดคำนี้!</p>
            </div>

            {/* Other players list */}
            <div className="px-4 flex-1">
                <p className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wider">
                    คำต้องห้ามของผู้เล่นคนอื่น
                </p>
                <div className="space-y-3">
                    {otherPlayers.map(p => (
                        <div
                            key={p.id}
                            className={`glass-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform ${p.isEliminated ? 'player-eliminated' : ''}`}
                            style={{ cursor: p.isEliminated ? 'default' : 'pointer' }}
                            onClick={() => !p.isEliminated && setCatchTarget(p)}
                        >
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                                style={{
                                    background: p.isEliminated
                                        ? 'rgba(255,255,255,0.1)'
                                        : 'linear-gradient(135deg, #7c3aed, #ff2d78)',
                                }}
                            >
                                {p.isEliminated ? '❌' : p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-xs text-white/40">{p.isEliminated ? 'ถูกจับแล้ว' : 'กำลังเล่น'}</p>
                            </div>
                            {!p.isEliminated && (
                                <div className="text-right flex-shrink-0">
                                    <p
                                        className="text-xl font-bold"
                                        style={{ color: '#ff2d78', fontFamily: 'Noto Sans Thai, sans-serif', textShadow: '0 0 10px rgba(255,45,120,0.5)' }}
                                    >
                                        {room.words[p.id]}
                                    </p>
                                    <p className="text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ background: 'rgba(255,45,120,0.2)', color: '#ff2d78' }}>
                                        🤫 แตะเพื่อจับ
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* HONK Button */}
            <div className="px-4 py-6 mt-4">
                <button
                    id="btn-honk"
                    onClick={handleHonk}
                    className={honkAnimating ? 'honk-animate' : ''}
                    style={{
                        width: '100%',
                        padding: '1.25rem',
                        fontSize: '1.6rem',
                        fontFamily: 'Bangers, cursive',
                        letterSpacing: '0.1em',
                        background: honkAnimating
                            ? 'linear-gradient(135deg, #ffe600, #ff9500)'
                            : 'linear-gradient(135deg, #ffe600, #ff9500)',
                        color: '#1a1a00',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: honkAnimating
                            ? '0 0 50px rgba(255,230,0,0.9), 0 8px 30px rgba(255,150,0,0.5)'
                            : '0 4px 20px rgba(255,230,0,0.3)',
                        transition: 'box-shadow 0.3s ease',
                    }}
                >
                    📯 HONK!!!
                </button>
            </div>

            {/* Catch confirmation modal */}
            {catchTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-5"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setCatchTarget(null)}
                >
                    <div
                        className="glass-card p-6 w-full max-w-sm pop-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-5">
                            <div className="text-5xl mb-3">🫵</div>
                            <h3 className="text-xl font-bold">
                                จับ <span style={{ color: '#ff2d78' }}>{catchTarget.name}</span> ?
                            </h3>
                            <p className="text-white/50 text-sm mt-2">
                                คุณแน่ใจว่า {catchTarget.name} พูดคำ
                                <span className="font-bold" style={{ color: '#ff2d78' }}> "{room.words[catchTarget.id]}" </span>
                                จริงๆ?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                id="btn-cancel-catch"
                                className="btn-secondary flex-1"
                                onClick={() => setCatchTarget(null)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                id="btn-confirm-catch"
                                className="btn-primary flex-1"
                                onClick={handleCatch}
                                disabled={catching}
                                style={{ flex: 1 }}
                            >
                                {catching ? '⏳' : '🎯 จับเลย!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
