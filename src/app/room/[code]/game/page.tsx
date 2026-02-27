'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import { Room, Player } from '@/lib/types';

// ─── Sound Synthesis ────────────────────────────────────────────────────────

function getAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
    if (!ref.current) {
        ref.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ref.current;
}

function playAirhorn(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        [80, 160, 240].forEach((freq, i) => {
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 0.97, now + 1.8);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.35 / (i + 1), now + 0.05);
            g.gain.setValueAtTime(0.35 / (i + 1), now + 1.5);
            g.gain.linearRampToValueAtTime(0, now + 1.9);
            osc.start(now); osc.stop(now + 1.9);
        });
    } catch { /* */ }
}

function playSadTrombone(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        [392, 330, 261, 220].forEach((freq, i) => {
            const s = now + i * 0.32; const d = i === 3 ? 0.9 : 0.3;
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, s);
            if (i === 3) osc.frequency.linearRampToValueAtTime(freq * 0.8, s + 0.9);
            g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.4, s + 0.04);
            g.gain.setValueAtTime(0.4, s + d - 0.05);
            g.gain.linearRampToValueAtTime(0, s + d);
            osc.start(s); osc.stop(s + d + 0.01);
        });
    } catch { /* */ }
}

function playDrumroll(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        for (let i = 0; i < 20; i++) {
            const t = now + i * 0.055;
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.04));
            const src = ctx.createBufferSource(); const g = ctx.createGain();
            src.buffer = buf; src.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.25, t); src.start(t);
        }
        const ct = now + 1.15;
        const cb = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
        const cd = cb.getChannelData(0);
        for (let j = 0; j < cd.length; j++) cd[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.5));
        const cs = ctx.createBufferSource(); const cg = ctx.createGain();
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
        cs.buffer = cb; cs.connect(hp); hp.connect(cg); cg.connect(ctx.destination);
        cg.gain.setValueAtTime(0.6, ct); cg.gain.exponentialRampToValueAtTime(0.001, ct + 1.2);
        cs.start(ct);
    } catch { /* */ }
}

function playFart(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < d.length; j++) {
            const t = j / ctx.sampleRate;
            d[j] = (Math.random() * 2 - 1) * 0.4 * Math.sin(2 * Math.PI * (80 + 40 * Math.sin(t * 15)) * t) * Math.exp(-t * 5);
        }
        const src = ctx.createBufferSource(); const g = ctx.createGain();
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
        src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(1.2, now); src.start(now);
    } catch { /* */ }
}

function playLaser(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination); osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
    } catch { /* */ }
}

function playApplause(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(r); const now = ctx.currentTime;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2.5, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < d.length; j++) {
            const t = j / ctx.sampleRate;
            d[j] = (Math.random() * 2 - 1) * (Math.sin(t * 14) > 0.3 ? 1 : 0.1) * Math.min(t / 0.3, 1);
        }
        const src = ctx.createBufferSource(); const g = ctx.createGain();
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 0.5;
        src.buffer = buf; src.connect(bp); bp.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.6, now); g.gain.setValueAtTime(0.6, now + 2.0);
        g.gain.linearRampToValueAtTime(0, now + 2.5); src.start(now);
    } catch { /* */ }
}

// ─── Sound Config ────────────────────────────────────────────────────────────

const SOUNDS = [
    { id: 'airhorn', emoji: '📯', label: 'HONK!!!', color: '#ffe600', textColor: '#1a1a00' },
    { id: 'sad', emoji: '😢', label: 'Wah Wah', color: '#9333ea', textColor: '#fff' },
    { id: 'drumroll', emoji: '🥁', label: 'Drumroll', color: '#00d4ff', textColor: '#001a22' },
    { id: 'fart', emoji: '💨', label: 'Braaaap', color: '#22c55e', textColor: '#fff' },
    { id: 'laser', emoji: '🔫', label: 'Pew Pew', color: '#ff2d78', textColor: '#fff' },
    { id: 'applause', emoji: '👏', label: 'Applause', color: '#f97316', textColor: '#fff' },
];

function doPlaySound(id: string, ref: React.MutableRefObject<AudioContext | null>) {
    const map: Record<string, (r: React.MutableRefObject<AudioContext | null>) => void> = {
        airhorn: playAirhorn, sad: playSadTrombone, drumroll: playDrumroll,
        fart: playFart, laser: playLaser, applause: playApplause,
    };
    map[id]?.(ref);
}

// ─── Soundboard Component ────────────────────────────────────────────────────

function Soundboard({ onPlay, animating }: { onPlay: (id: string) => void, animating: string | null }) {
    return (
        <div>
            <p className="text-xs text-center mb-2 uppercase tracking-widest font-medium"
                style={{ color: 'var(--text-tertiary)' }}>
                🎛️ Soundboard
            </p>
            <div className="grid grid-cols-3 gap-2">
                {SOUNDS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onPlay(s.id)}
                        className={`sound-btn ${animating === s.id ? 'honk-animate' : ''}`}
                        style={{
                            background: `linear-gradient(145deg, ${s.color}, ${s.color}cc)`,
                            color: s.textColor,
                            boxShadow: animating === s.id
                                ? `0 0 30px ${s.color}88, 0 4px 20px ${s.color}44`
                                : `0 4px 16px ${s.color}33`,
                            transform: animating === s.id ? 'scale(1.06)' : 'scale(1)',
                        }}
                    >
                        <span className="sound-emoji">{s.emoji}</span>
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GamePage() {
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [room, setRoom] = useState<Room | null>(null);
    const [playerId, setPlayerId] = useState('');
    const [flashColor, setFlashColor] = useState<string | null>(null);
    const [catchTarget, setCatchTarget] = useState<Player | null>(null);
    const [catching, setCatching] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [eliminated, setEliminated] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [animatingSound, setAnimatingSound] = useState<string | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

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

        channel.subscribe('player-caught', (msg) => {
            setRoom(msg.data.room);
            if (msg.data.targetId === pid) setEliminated(true);
            if (msg.data.gameEnded) setWinner(msg.data.winner);
        });

        channel.subscribe('sound', (msg) => {
            const { soundId } = msg.data;
            doPlaySound(soundId, audioRef);
            const color = SOUNDS.find(s => s.id === soundId)?.color ?? '#fff';
            setFlashColor(color);
            setTimeout(() => setFlashColor(null), 700);
        });

        channel.subscribe('game-started', (msg) => setRoom(msg.data.room));

        channel.subscribe('room-reset', (msg) => {
            setRoom(msg.data.room);
            setWinner(null); setEliminated(false);
            router.push(`/room/${code}/lobby`);
        });

        return () => { channel.detach(); client.close(); };
    }, [code, fetchRoom, router]);

    useEffect(() => {
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    const handleSound = async (soundId: string) => {
        doPlaySound(soundId, audioRef);
        setAnimatingSound(soundId);
        setTimeout(() => setAnimatingSound(null), 400);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sound', soundId, playerId }),
        });
    };

    const handleCatch = async () => {
        if (!catchTarget || catching) return;
        setCatching(true);
        const res = await fetch(`/api/rooms/${code}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'catch', catcherId: playerId, targetId: catchTarget.id }),
        });
        const data = await res.json();
        setRoom(data.room);
        if (data.gameEnded) setWinner(data.winner);
        setCatchTarget(null); setCatching(false);
    };

    const handleBackToLobby = async () => {
        setResetting(true);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset', playerId }),
        });
        setWinner(null); setEliminated(false);
        router.push(`/room/${code}/lobby`);
    };

    // ── Loading ──
    if (!room) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="ambient-bg"><div className="ambient-blob" /><div className="ambient-blob" /><div className="ambient-blob" /></div>
                <div className="text-center relative z-10">
                    <div className="text-5xl mb-3 float">🎮</div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const players = Object.values(room.players);
    const myWord = room.words[playerId];
    const otherPlayers = players.filter(p => p.id !== playerId);
    const myPlayer = room.players[playerId];
    const winnerPlayer = winner ? room.players[winner] : null;

    // ══════ Game Over ══════
    if (winner) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8 relative">
                <div className="ambient-bg"><div className="ambient-blob" /><div className="ambient-blob" /><div className="ambient-blob" /></div>
                {/* Golden radial */}
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,230,0,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />

                <div className="relative z-10 w-full max-w-sm pop-in">
                    <div className="text-center mb-5">
                        <div className="text-7xl mb-3">🏆</div>
                        <h1 className="game-title mb-1" style={{ fontSize: '2.5rem' }}>เกมจบแล้ว!</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>ผู้รอดชีวิตคนสุดท้าย</p>
                        <p className="text-2xl font-bold mt-2 text-glow-yellow" style={{ color: 'var(--yellow)' }}>
                            {winnerPlayer?.name ?? '?'}
                        </p>
                    </div>

                    {/* Word reveal */}
                    <div className="glass-elevated p-4 mb-5">
                        <p className="text-xs text-center mb-3 uppercase tracking-widest font-medium"
                            style={{ color: 'var(--text-tertiary)' }}>คำต้องห้ามทั้งหมด</p>
                        <div className="space-y-1 stagger-children">
                            {players.map(p => (
                                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                    style={{ background: 'var(--surface)' }}>
                                    <div className={`avatar avatar-sm ${p.id === winner ? 'avatar-host' : p.isEliminated ? 'avatar-eliminated' : 'avatar-player'}`}>
                                        {p.id === winner ? '🏆' : p.isEliminated ? '❌' : '✅'}
                                    </div>
                                    <span className="font-medium text-sm flex-1 truncate">{p.name}</span>
                                    <span className="font-bold text-glow-pink" style={{ color: 'var(--pink)', fontFamily: 'Noto Sans Thai, sans-serif', fontSize: '1rem' }}>
                                        {room.words[p.id]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Soundboard */}
                    <div className="mb-5">
                        <Soundboard onPlay={handleSound} animating={animatingSound} />
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button className="btn-primary" onClick={handleBackToLobby} disabled={resetting}>
                            {resetting ? '⏳ กำลังกลับ...' : '🔄 เล่นรอบใหม่'}
                        </button>
                        <button className="btn-secondary" onClick={() => router.push('/')}>
                            🏠 กลับหน้าแรก
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ══════ Eliminated ══════
    if (eliminated || myPlayer?.isEliminated) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8 relative">
                <div className="ambient-bg"><div className="ambient-blob" /><div className="ambient-blob" /><div className="ambient-blob" /></div>
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,45,120,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

                <div className="relative z-10 w-full max-w-sm pop-in">
                    <div className="text-center mb-4">
                        <div className="text-7xl mb-3">😱</div>
                        <h1 className="text-glow-pink mb-1" style={{ fontFamily: 'Bangers, cursive', fontSize: '2.3rem', color: 'var(--pink)' }}>
                            โดนจับได้แล้ว!
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>คุณพูดคำต้องห้ามออกไปแล้ว</p>
                    </div>

                    {myWord && (
                        <div className="glass gradient-border p-5 mb-5 text-center">
                            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>คำต้องห้ามของคุณคือ</p>
                            <p className="text-glow-pink" style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--pink)', fontFamily: 'Noto Sans Thai, sans-serif' }}>
                                {myWord}
                            </p>
                        </div>
                    )}

                    <p className="text-center text-xs mb-5 italic" style={{ color: 'var(--text-tertiary)' }}>
                        ดูผู้เล่นที่เหลือสู้กันต่อ 👀
                    </p>

                    {/* Remaining players */}
                    <div className="glass-elevated p-4 mb-5">
                        <p className="text-xs text-center mb-3 uppercase tracking-widest font-medium"
                            style={{ color: 'var(--text-tertiary)' }}>ผู้เล่นที่เหลือ</p>
                        <div className="space-y-1 stagger-children">
                            {players.filter(p => !p.isEliminated && p.id !== playerId).map(p => (
                                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                    style={{ background: 'var(--surface)' }}>
                                    <div className="avatar avatar-sm avatar-player">{p.name.charAt(0).toUpperCase()}</div>
                                    <span className="font-medium text-sm flex-1 truncate">{p.name}</span>
                                    <span className="font-bold text-glow-pink" style={{ color: 'var(--pink)', fontSize: '1rem' }}>
                                        {room.words[p.id]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Soundboard — spectators can still troll */}
                    <Soundboard onPlay={handleSound} animating={animatingSound} />
                </div>
            </div>
        );
    }

    // ══════ Active Game ══════
    return (
        <div className="min-h-dvh flex flex-col max-w-sm mx-auto relative safe-bottom">
            <div className="ambient-bg"><div className="ambient-blob" /><div className="ambient-blob" /><div className="ambient-blob" /></div>

            {/* Sound flash */}
            {flashColor && (
                <div className="flash-overlay active" style={{ background: `radial-gradient(circle at center, ${flashColor}22, transparent 70%)` }} />
            )}

            <div className="relative z-10 flex flex-col flex-1">
                {/* Top bar */}
                <div className="px-5 pt-6 pb-3 flex justify-between items-center">
                    <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ห้อง</p>
                        <p style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.12em', color: 'var(--yellow)', fontSize: '1.2rem', fontWeight: 700, textShadow: '0 0 15px rgba(255,230,0,0.3)' }}>
                            {code}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ยังอยู่</p>
                        <p className="font-bold text-lg">
                            <span style={{ color: 'var(--green)' }}>{players.filter(p => !p.isEliminated).length}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>/{players.length}</span>
                        </p>
                    </div>
                </div>

                {/* My secret word */}
                <div className="mx-5 mb-4 glass gradient-border p-4 text-center no-select">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        🤫 คำต้องห้ามของคุณ — อย่าพูดออกมา!
                    </p>
                    <div style={{
                        display: 'inline-block', padding: '0.4rem 1.5rem',
                        background: 'rgba(0,0,0,0.4)', borderRadius: '12px',
                        filter: 'blur(6px)', fontSize: '1.5rem', letterSpacing: '0.2em',
                        color: 'rgba(255,255,255,0.1)',
                    }}>
                        ????????
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>ซ่อนอยู่ — ระวัง!</p>
                </div>

                {/* Players list */}
                <div className="px-5 flex-1">
                    <p className="text-xs mb-3 font-medium uppercase tracking-widest"
                        style={{ color: 'var(--text-tertiary)' }}>
                        คำต้องห้ามของคนอื่น
                    </p>
                    <div className="space-y-2.5 stagger-children">
                        {otherPlayers.map(p => (
                            <div
                                key={p.id}
                                className={`glass p-3.5 flex items-center gap-3 transition-transform active:scale-[0.97] ${p.isEliminated ? 'player-eliminated' : ''}`}
                                style={{ cursor: p.isEliminated ? 'default' : 'pointer' }}
                                onClick={() => !p.isEliminated && setCatchTarget(p)}
                            >
                                <div className={`avatar avatar-md ${p.isEliminated ? 'avatar-eliminated' : 'avatar-player'}`}>
                                    {p.isEliminated ? '❌' : p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{p.name}</p>
                                    <p className="text-xs" style={{ color: p.isEliminated ? 'var(--text-tertiary)' : 'var(--text-tertiary)' }}>
                                        {p.isEliminated ? 'ถูกจับแล้ว' : 'กำลังเล่น'}
                                    </p>
                                </div>
                                {!p.isEliminated && (
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-glow-pink"
                                            style={{ color: 'var(--pink)', fontFamily: 'Noto Sans Thai, sans-serif', fontSize: '1.2rem' }}>
                                            {room.words[p.id]}
                                        </p>
                                        <span className="badge badge-catch">🤫 แตะจับ</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Soundboard */}
                <div className="px-5 pt-5 pb-4">
                    <Soundboard onPlay={handleSound} animating={animatingSound} />
                </div>
            </div>

            {/* Catch Modal */}
            {catchTarget && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-5"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
                    onClick={() => setCatchTarget(null)}>
                    <div className="glass-elevated p-6 w-full max-w-sm pop-in" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-5">
                            <div className="text-5xl mb-3">🫵</div>
                            <h3 className="text-xl font-bold">
                                จับ <span style={{ color: 'var(--pink)' }}>{catchTarget.name}</span> ?
                            </h3>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                                {catchTarget.name} พูดคำ
                                <span style={{ color: 'var(--pink)', fontWeight: 700 }}> &ldquo;{room.words[catchTarget.id]}&rdquo; </span>
                                จริงๆ?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn-secondary flex-1" onClick={() => setCatchTarget(null)}>ยกเลิก</button>
                            <button className="btn-primary flex-1" onClick={handleCatch} disabled={catching}>
                                {catching ? '⏳' : '🎯 จับเลย!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
