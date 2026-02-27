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

function playAirhorn(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        // Ship-horn: low sawtooth + harmonics
        [80, 160, 240].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 0.97, now + 1.8);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.35 / (i + 1), now + 0.05);
            gain.gain.setValueAtTime(0.35 / (i + 1), now + 1.5);
            gain.gain.linearRampToValueAtTime(0, now + 1.9);
            osc.start(now); osc.stop(now + 1.9);
        });
    } catch { /* ignore */ }
}

function playSadTrombone(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        // Wah wah waaah: G4 → E4 → C4 → A3
        const notes = [392, 330, 261, 220];
        notes.forEach((freq, i) => {
            const start = now + i * 0.32;
            const duration = i === notes.length - 1 ? 0.9 : 0.3;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            if (i === notes.length - 1) osc.frequency.linearRampToValueAtTime(freq * 0.8, start + 0.9);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.4, start + 0.04);
            gain.gain.setValueAtTime(0.4, start + duration - 0.05);
            gain.gain.linearRampToValueAtTime(0, start + duration);
            osc.start(start); osc.stop(start + duration + 0.01);
        });
    } catch { /* ignore */ }
}

function playDrumroll(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        // Fast snare roll
        for (let i = 0; i < 20; i++) {
            const t = now + i * 0.055;
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.04));
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            src.buffer = buf; src.connect(gain); gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.25, t);
            src.start(t);
        }
        // Crash cymbal
        const crashT = now + 1.15;
        const cBuf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
        const cData = cBuf.getChannelData(0);
        for (let j = 0; j < cData.length; j++) cData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.5));
        const cSrc = ctx.createBufferSource();
        const cGain = ctx.createGain();
        const hiPass = ctx.createBiquadFilter();
        hiPass.type = 'highpass'; hiPass.frequency.value = 6000;
        cSrc.buffer = cBuf; cSrc.connect(hiPass); hiPass.connect(cGain); cGain.connect(ctx.destination);
        cGain.gain.setValueAtTime(0.6, crashT);
        cGain.gain.exponentialRampToValueAtTime(0.001, crashT + 1.2);
        cSrc.start(crashT);
    } catch { /* ignore */ }
}

function playFart(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        const duration = 0.45;
        const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
            const t = j / ctx.sampleRate;
            const noise = Math.random() * 2 - 1;
            const wobble = Math.sin(2 * Math.PI * (80 + 40 * Math.sin(t * 15)) * t);
            data[j] = noise * 0.4 * wobble * Math.exp(-t * 5);
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const lowPass = ctx.createBiquadFilter();
        lowPass.type = 'lowpass'; lowPass.frequency.value = 400;
        src.buffer = buf; src.connect(lowPass); lowPass.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(1.2, now);
        src.start(now);
    } catch { /* ignore */ }
}

function playLaser(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
    } catch { /* ignore */ }
}

function playApplause(audioRef: React.MutableRefObject<AudioContext | null>) {
    try {
        const ctx = getAudioCtx(audioRef);
        const now = ctx.currentTime;
        const duration = 2.5;
        const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
            const t = j / ctx.sampleRate;
            const claps = Math.sin(t * 14) > 0.3 ? 1 : 0.1;
            data[j] = (Math.random() * 2 - 1) * claps * Math.min(t / 0.3, 1);
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const bandPass = ctx.createBiquadFilter();
        bandPass.type = 'bandpass'; bandPass.frequency.value = 3000; bandPass.Q.value = 0.5;
        src.buffer = buf; src.connect(bandPass); bandPass.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.setValueAtTime(0.6, now + 2.0);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        src.start(now);
    } catch { /* ignore */ }
}

// ─── Sound Config ────────────────────────────────────────────────────────────

const SOUNDS = [
    { id: 'airhorn', emoji: '📯', label: 'HONK!!!', color: '#ffe600', textColor: '#1a1a00' },
    { id: 'sad', emoji: '😢', label: 'Wah Wah...', color: '#7c3aed', textColor: '#fff' },
    { id: 'drumroll', emoji: '🥁', label: 'Drumroll!', color: '#00d4ff', textColor: '#001a22' },
    { id: 'fart', emoji: '💨', label: 'Braaaap', color: '#22c55e', textColor: '#fff' },
    { id: 'laser', emoji: '🔫', label: 'Pew Pew!', color: '#ff2d78', textColor: '#fff' },
    { id: 'applause', emoji: '👏', label: 'Applause!', color: '#f97316', textColor: '#fff' },
];

function playSound(id: string, audioRef: React.MutableRefObject<AudioContext | null>) {
    switch (id) {
        case 'airhorn': playAirhorn(audioRef); break;
        case 'sad': playSadTrombone(audioRef); break;
        case 'drumroll': playDrumroll(audioRef); break;
        case 'fart': playFart(audioRef); break;
        case 'laser': playLaser(audioRef); break;
        case 'applause': playApplause(audioRef); break;
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GamePage() {
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [room, setRoom] = useState<Room | null>(null);
    const [playerId, setPlayerId] = useState('');
    const [flashSound, setFlashSound] = useState<string | null>(null);
    const [catchTarget, setCatchTarget] = useState<Player | null>(null);
    const [catching, setCatching] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [eliminated, setEliminated] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [animatingSound, setAnimatingSound] = useState<string | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

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
            playSound(soundId, audioRef);
            setFlashSound(soundId);
            setTimeout(() => setFlashSound(null), 700);
        });

        channel.subscribe('game-started', (msg) => { setRoom(msg.data.room); });

        channel.subscribe('room-reset', (msg) => {
            setRoom(msg.data.room);
            setWinner(null);
            setEliminated(false);
            router.push(`/room/${code}/lobby`);
        });

        return () => { channel.detach(); client.close(); };
    }, [code, fetchRoom, router]);

    useEffect(() => {
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    const handleSound = async (soundId: string) => {
        playSound(soundId, audioRef);
        setAnimatingSound(soundId);
        setTimeout(() => setAnimatingSound(null), 400);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sound', soundId, playerId }),
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

    const handleBackToLobby = async () => {
        setResetting(true);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset', playerId }),
        });
        // room-reset Ably event will redirect everyone; also redirect self
        setWinner(null);
        setEliminated(false);
        router.push(`/room/${code}/lobby`);
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
    const winnerPlayer = winner ? room.players[winner] : null;
    const isHost = room.hostId === playerId;

    // ── Game Over Screen ──
    if (winner) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center">
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,230,0,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="relative z-10 pop-in w-full max-w-sm">
                    <div className="text-8xl mb-4">🏆</div>
                    <h1 style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.05em', color: '#ffe600', textShadow: '0 0 30px rgba(255,230,0,0.8)', fontSize: '2.8rem', marginBottom: '0.25rem' }}>
                        เกมจบแล้ว!
                    </h1>
                    <p className="text-white/60 mb-1 text-sm">ผู้รอดชีวิตคนสุดท้าย</p>
                    <p className="text-3xl font-bold text-white mb-6">{winnerPlayer?.name ?? '?'}</p>

                    <div className="glass-card p-4 mb-5 text-left">
                        <p className="text-white/50 text-xs mb-3 text-center uppercase tracking-wider">คำต้องห้ามทั้งหมด</p>
                        {players.map(p => (
                            <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                <span className="text-white/80 flex items-center gap-2 text-sm">
                                    {p.id === winner ? '🏆' : p.isEliminated ? '❌' : '✅'} {p.name}
                                </span>
                                <span className="font-bold text-base" style={{ color: '#ff2d78' }}>{room.words[p.id]}</span>
                            </div>
                        ))}
                    </div>

                    {/* Soundboard on game over too */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {SOUNDS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleSound(s.id)}
                                className={animatingSound === s.id ? 'honk-animate' : ''}
                                style={{
                                    padding: '0.65rem 0.4rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: s.color,
                                    color: s.textColor,
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    fontFamily: 'Bangers, cursive',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                    boxShadow: `0 4px 15px ${s.color}55`,
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                }}
                            >
                                <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <button id="btn-back-to-lobby" className="btn-primary" onClick={handleBackToLobby} disabled={resetting}>
                        {resetting ? '⏳ กำลังกลับ...' : '🔄 เล่นรอบใหม่ (ห้องเดิม)'}
                    </button>
                    <button className="btn-secondary mt-2" onClick={() => router.push('/')} style={{ marginTop: '0.5rem' }}>
                        🏠 กลับหน้าแรก
                    </button>
                </div>
            </div>
        );
    }

    // ── Eliminated Screen ──
    if (eliminated || myPlayer?.isEliminated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,45,120,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="relative z-10 pop-in w-full max-w-sm">
                    <div className="text-8xl mb-4">😱</div>
                    <h1 style={{ fontFamily: 'Bangers, cursive', color: '#ff2d78', fontSize: '2.5rem', textShadow: '0 0 30px rgba(255,45,120,0.7)', marginBottom: '0.5rem' }}>โดนจับได้แล้ว!</h1>
                    <p className="text-white/60 mb-4 text-sm">คุณพูดคำต้องห้ามออกไปแล้ว</p>
                    {myWord && (
                        <div className="glass-card px-8 py-4 mb-4 inline-block">
                            <p className="text-white/50 text-xs mb-1">คำต้องห้ามของคุณคือ</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ff2d78', fontFamily: 'Noto Sans Thai, sans-serif' }}>{myWord}</p>
                        </div>
                    )}
                    <p className="text-white/40 text-sm italic mb-4">ดูผู้เล่นที่เหลือสู้กันต่อ 👀</p>

                    {/* Spectator soundboard */}
                    <div className="grid grid-cols-3 gap-2">
                        {SOUNDS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleSound(s.id)}
                                className={animatingSound === s.id ? 'honk-animate' : ''}
                                style={{
                                    padding: '0.65rem 0.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    background: s.color, color: s.textColor, fontWeight: 700, fontSize: '0.75rem',
                                    fontFamily: 'Bangers, cursive', letterSpacing: '0.05em',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                    boxShadow: `0 4px 15px ${s.color}55`,
                                }}
                            >
                                <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Game Screen ──
    const flashColor = flashSound ? (SOUNDS.find(s => s.id === flashSound)?.color ?? '#ffe600') : null;

    return (
        <div
            className="min-h-screen flex flex-col max-w-sm mx-auto"
            style={{
                transition: 'background 0.25s',
                background: flashColor ? `${flashColor}15` : undefined,
            }}
        >
            {/* Top bar */}
            <div className="px-4 pt-6 pb-3 flex justify-between items-center">
                <div>
                    <p className="text-white/40 text-xs">ห้อง</p>
                    <p style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.15em', color: '#ffe600', fontSize: '1.3rem', fontWeight: 700 }}>{code}</p>
                </div>
                <div className="text-right">
                    <p className="text-white/40 text-xs">ผู้เล่น</p>
                    <p className="font-bold text-lg">{players.filter(p => !p.isEliminated).length}/{players.length}</p>
                </div>
            </div>

            {/* My secret word banner */}
            <div className="mx-4 mb-4 p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(255,45,120,0.15), rgba(124,58,237,0.15))', border: '1.5px solid rgba(255,45,120,0.3)' }}>
                <p className="text-white/60 text-xs mb-2">🤫 คำต้องห้ามของคุณ — อย่าพูดคำนี้!</p>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '0.5rem 1.5rem', display: 'inline-block', filter: 'blur(6px)', userSelect: 'none', fontSize: '1.5rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)' }}>
                    ????????
                </div>
                <p className="text-white/30 text-xs mt-2">ซ่อนอยู่ — ระวังอย่าพูดออกไป!</p>
            </div>

            {/* Other players */}
            <div className="px-4 flex-1">
                <p className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wider">คำต้องห้ามของผู้เล่นคนอื่น</p>
                <div className="space-y-3">
                    {otherPlayers.map(p => (
                        <div
                            key={p.id}
                            className={`glass-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform ${p.isEliminated ? 'player-eliminated' : ''}`}
                            style={{ cursor: p.isEliminated ? 'default' : 'pointer' }}
                            onClick={() => !p.isEliminated && setCatchTarget(p)}
                        >
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                                style={{ background: p.isEliminated ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #ff2d78)' }}>
                                {p.isEliminated ? '❌' : p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{p.name}</p>
                                <p className="text-xs text-white/40">{p.isEliminated ? 'ถูกจับแล้ว' : 'กำลังเล่น'}</p>
                            </div>
                            {!p.isEliminated && (
                                <div className="text-right flex-shrink-0">
                                    <p style={{ color: '#ff2d78', fontFamily: 'Noto Sans Thai, sans-serif', fontSize: '1.3rem', fontWeight: 700, textShadow: '0 0 10px rgba(255,45,120,0.5)' }}>
                                        {room.words[p.id]}
                                    </p>
                                    <p className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: 'rgba(255,45,120,0.2)', color: '#ff2d78' }}>
                                        🤫 แตะเพื่อจับ
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Soundboard */}
            <div className="px-4 pt-5 pb-2">
                <p className="text-white/40 text-xs mb-2 text-center uppercase tracking-wider">🎛️ Soundboard</p>
                <div className="grid grid-cols-3 gap-2">
                    {SOUNDS.map(s => (
                        <button
                            key={s.id}
                            id={`btn-sound-${s.id}`}
                            onClick={() => handleSound(s.id)}
                            className={animatingSound === s.id ? 'honk-animate' : ''}
                            style={{
                                padding: '0.8rem 0.4rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                                color: s.textColor, fontWeight: 700, fontSize: '0.8rem',
                                fontFamily: 'Bangers, cursive', letterSpacing: '0.05em',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                boxShadow: animatingSound === s.id ? `0 0 30px ${s.color}99` : `0 4px 15px ${s.color}44`,
                                transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                                transform: animatingSound === s.id ? 'scale(1.08)' : 'scale(1)',
                            }}
                        >
                            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{s.emoji}</span>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-6" />

            {/* Catch modal */}
            {catchTarget && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-5"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setCatchTarget(null)}>
                    <div className="glass-card p-6 w-full max-w-sm pop-in" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-5">
                            <div className="text-5xl mb-3">🫵</div>
                            <h3 className="text-xl font-bold">จับ <span style={{ color: '#ff2d78' }}>{catchTarget.name}</span> ?</h3>
                            <p className="text-white/50 text-sm mt-2">
                                {catchTarget.name} พูดคำ <span style={{ color: '#ff2d78', fontWeight: 700 }}>"{room.words[catchTarget.id]}"</span> จริงๆ?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button id="btn-cancel-catch" className="btn-secondary flex-1" onClick={() => setCatchTarget(null)}>ยกเลิก</button>
                            <button id="btn-confirm-catch" className="btn-primary flex-1" onClick={handleCatch} disabled={catching}>
                                {catching ? '⏳' : '🎯 จับเลย!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
