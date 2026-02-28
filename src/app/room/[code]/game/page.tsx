'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Ably from 'ably';
import { Room, Player } from '@/lib/types';

// ─── Sound Synthesis (unchanged) ────────────────────────────────────────────

function getCtx(r: React.MutableRefObject<AudioContext | null>): AudioContext {
    if (!r.current) r.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return r.current;
}

function playAirhorn(r: React.MutableRefObject<AudioContext | null>) {
    try { const c = getCtx(r), n = c.currentTime;[80, 160, 240].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, n); o.frequency.linearRampToValueAtTime(f * .97, n + 1.8); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.35 / (i + 1), n + .05); g.gain.setValueAtTime(.35 / (i + 1), n + 1.5); g.gain.linearRampToValueAtTime(0, n + 1.9); o.start(n); o.stop(n + 1.9); }); } catch { }
}
function playSadTrombone(r: React.MutableRefObject<AudioContext | null>) {
    try { const c = getCtx(r), n = c.currentTime;[392, 330, 261, 220].forEach((f, i) => { const s = n + i * .32, d = i === 3 ? .9 : .3, o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, s); if (i === 3) o.frequency.linearRampToValueAtTime(f * .8, s + .9); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.4, s + .04); g.gain.setValueAtTime(.4, s + d - .05); g.gain.linearRampToValueAtTime(0, s + d); o.start(s); o.stop(s + d + .01); }); } catch { }
}
function playDrumroll(r: React.MutableRefObject<AudioContext | null>) {
    try { const c = getCtx(r), n = c.currentTime; for (let i = 0; i < 20; i++) { const t = n + i * .055, b = c.createBuffer(1, c.sampleRate * .08, c.sampleRate), d = b.getChannelData(0); for (let j = 0; j < d.length; j++)d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (c.sampleRate * .04)); const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.25, t); s.start(t); } const ct = n + 1.15, cb = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate), cd = cb.getChannelData(0); for (let j = 0; j < cd.length; j++)cd[j] = (Math.random() * 2 - 1) * Math.exp(-j / (c.sampleRate * .5)); const cs = c.createBufferSource(), cg = c.createGain(), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; cs.buffer = cb; cs.connect(hp); hp.connect(cg); cg.connect(c.destination); cg.gain.setValueAtTime(.6, ct); cg.gain.exponentialRampToValueAtTime(.001, ct + 1.2); cs.start(ct); } catch { }
}
function playFart(r: React.MutableRefObject<AudioContext | null>) {
    try {
        const c = getCtx(r), n = c.currentTime;
        const dur = 0.8; // Longer duration
        const osc1 = c.createOscillator();
        const osc2 = c.createOscillator();
        const noise = c.createBufferSource();
        const g = c.createGain();
        const filter = c.createBiquadFilter();

        // Noise buffer
        const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
        for (let j = 0; j < d.length; j++) {
            const t = j / c.sampleRate;
            d[j] = (Math.random() * 2 - 1) * Math.exp(-t * 4); // Noise decay
        }
        noise.buffer = b;
        noise.loop = true;

        // Fart body (Oscillator 1)
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(60, n);
        osc1.frequency.exponentialRampToValueAtTime(10, n + dur);

        // Fart resonance/squeak (Oscillator 2)
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(150, n);
        osc2.frequency.exponentialRampToValueAtTime(40, n + dur * 0.5);

        // Filter to shape the sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, n);
        filter.frequency.exponentialRampToValueAtTime(100, n + dur);
        filter.Q.value = 5;

        // Gain envelope for loud punch and decay
        g.gain.setValueAtTime(0, n);
        g.gain.linearRampToValueAtTime(2.5, n + 0.05); // Very loud attack
        g.gain.exponentialRampToValueAtTime(0.01, n + dur);

        // Connections
        osc1.connect(filter);
        osc2.connect(filter);
        noise.connect(filter);
        filter.connect(g);
        g.connect(c.destination);

        osc1.start(n); osc1.stop(n + dur);
        osc2.start(n); osc2.stop(n + dur);
        noise.start(n); noise.stop(n + dur);
    } catch { }
}
function playLaser(r: React.MutableRefObject<AudioContext | null>) {
    try { const c = getCtx(r), n = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'square'; o.frequency.setValueAtTime(1800, n); o.frequency.exponentialRampToValueAtTime(120, n + .4); g.gain.setValueAtTime(.4, n); g.gain.exponentialRampToValueAtTime(.001, n + .45); o.start(n); o.stop(n + .45); } catch { }
}
function playApplause(r: React.MutableRefObject<AudioContext | null>) {
    try { const c = getCtx(r), n = c.currentTime, b = c.createBuffer(1, c.sampleRate * 2.5, c.sampleRate), d = b.getChannelData(0); for (let j = 0; j < d.length; j++) { const t = j / c.sampleRate; d[j] = (Math.random() * 2 - 1) * (Math.sin(t * 14) > .3 ? 1 : .1) * Math.min(t / .3, 1); } const s = c.createBufferSource(), g = c.createGain(), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = .5; s.buffer = b; s.connect(bp); bp.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.6, n); g.gain.setValueAtTime(.6, n + 2); g.gain.linearRampToValueAtTime(0, n + 2.5); s.start(n); } catch { }
}

const SOUNDS = [
    { id: 'airhorn', emoji: '📯', label: 'HONK!', bg: '#FFD43B', border: '#FCC419', text: '#5C4B00' },
    { id: 'sad', emoji: '😢', label: 'Wah Wah', bg: '#E5DBFF', border: '#7C5CFC', text: '#6741D9' },
    { id: 'drumroll', emoji: '🥁', label: 'Drumroll', bg: '#C3FAE8', border: '#20C997', text: '#087F5B' },
    { id: 'fart', emoji: '💨', label: 'Braaaap', bg: '#D3F9D8', border: '#51CF66', text: '#2B8A3E' },
    { id: 'laser', emoji: '🔫', label: 'Pew Pew', bg: '#FFE0EB', border: '#FF6B9D', text: '#C2255C' },
    { id: 'applause', emoji: '👏', label: 'Applause', bg: '#FFE8CC', border: '#FF922B', text: '#D9480F' },
];

function doPlay(id: string, ref: React.MutableRefObject<AudioContext | null>) {
    const m: Record<string, (r: React.MutableRefObject<AudioContext | null>) => void> = { airhorn: playAirhorn, sad: playSadTrombone, drumroll: playDrumroll, fart: playFart, laser: playLaser, applause: playApplause };
    m[id]?.(ref);
}

const ACOLORS = ['avatar-0', 'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7'];

// ─── Soundboard ──────────────────────────────────────────────────────────────

function Soundboard({ onPlay, active }: { onPlay: (id: string) => void; active: string | null }) {
    return (
        <div>
            <p className="section-label text-center mb-2">🎛️ Soundboard</p>
            <div className="grid grid-cols-3 gap-2">
                {SOUNDS.map(s => (
                    <button key={s.id} onClick={() => onPlay(s.id)}
                        className={`sound-btn ${active === s.id ? 'wiggle' : ''}`}
                        style={{
                            background: s.bg, borderColor: s.border, color: s.text,
                            boxShadow: active === s.id ? `0 0 20px ${s.border}66` : `0 3px 0 ${s.border}`,
                            transform: active === s.id ? 'scale(1.06) translateY(-2px)' : 'translateY(0)',
                        }}>
                        <span className="sound-emoji">{s.emoji}</span>
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

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
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

    const fetchRoom = useCallback(async () => {
        const res = await fetch(`/api/rooms/${code}`);
        if (res.ok) { const d = await res.json(); setRoom(d.room); }
    }, [code]);

    useEffect(() => {
        const pid = sessionStorage.getItem('playerId');
        const tokenStr = sessionStorage.getItem('tokenRequest');
        if (!pid || !tokenStr) { router.push('/'); return; }
        setPlayerId(pid); fetchRoom();

        const tr = JSON.parse(tokenStr);
        const client = new Ably.Realtime({ authCallback: (_d, cb) => { cb(null, tr as Ably.TokenRequest); }, clientId: pid });
        const ch = client.channels.get(`room:${code}`);

        ch.subscribe('player-caught', (msg) => {
            setRoom(msg.data.room);
            if (msg.data.targetId === pid) setEliminated(true);
            if (msg.data.gameEnded) setWinner(msg.data.winner);
        });
        ch.subscribe('sound', (msg) => {
            doPlay(msg.data.soundId, audioRef);
            const c = SOUNDS.find(s => s.id === msg.data.soundId)?.bg ?? '#FFD43B';
            setFlashColor(c); setTimeout(() => setFlashColor(null), 700);
        });
        ch.subscribe('game-started', (msg) => setRoom(msg.data.room));
        ch.subscribe('room-reset', (msg) => { setRoom(msg.data.room); setWinner(null); setEliminated(false); router.push(`/room/${code}/lobby`); });
        ch.subscribe('player-left', (msg) => {
            if (msg.data.leftId !== pid) setRoom(msg.data.room);
        });
        ch.subscribe('room-closed', () => {
            alert('ห้องถูกปิดแล้ว (Host ออก) หรือไม่มีผู้เล่นเหลืออยู่');
            router.push('/');
        });

        return () => { ch.detach(); client.close(); };
    }, [code, fetchRoom, router]);

    useEffect(() => { const i = setInterval(fetchRoom, 5000); return () => clearInterval(i); }, [fetchRoom]);

    const handleSound = async (soundId: string) => {
        doPlay(soundId, audioRef);
        setActiveSound(soundId); setTimeout(() => setActiveSound(null), 500);
        await fetch(`/api/rooms/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sound', soundId, playerId }) });
    };

    const handleCatch = async () => {
        if (!catchTarget || catching) return; setCatching(true);
        const res = await fetch(`/api/rooms/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'catch', catcherId: playerId, targetId: catchTarget.id }) });
        const d = await res.json(); setRoom(d.room);
        if (d.gameEnded) setWinner(d.winner);
        setCatchTarget(null); setCatching(false);
    };

    const handleReset = async () => {
        setResetting(true);
        await fetch(`/api/rooms/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset', playerId }) });
        setWinner(null); setEliminated(false); router.push(`/room/${code}/lobby`);
    };

    const [quitting, setQuitting] = useState(false);
    const handleQuit = async () => {
        setQuitting(true);
        await fetch(`/api/rooms/${code}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'leave', playerId }),
        });
        router.push('/');
    };

    if (!room) return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            <div className="fun-bg"><div className="shape" /><div className="shape" /><div className="shape" /><div className="shape" /></div>
            <div className="text-center relative z-10">
                <div className="text-5xl mb-3 float">🎮</div>
                <p className="font-bold" style={{ color: 'var(--text-tertiary)' }}>กำลังโหลด...</p>
            </div>
        </div>
    );

    const players = Object.values(room.players);
    const myWord = room.words[playerId];
    const others = players.filter(p => p.id !== playerId);
    const myPlayer = room.players[playerId];
    const winP = winner ? room.players[winner] : null;

    // ═══ GAME OVER ═══
    if (winner) return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
            <div className="fun-bg"><div className="shape" /><div className="shape" /><div className="shape" /><div className="shape" /></div>
            <div className="relative z-10 w-full max-w-sm">
                <div className="text-center mb-5 bounce-in">
                    <div className="text-7xl mb-3">🏆</div>
                    <h1 className="game-title mb-1" style={{ fontSize: '2.4rem' }}>เกมจบแล้ว!</h1>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>ผู้รอดชีวิตคนสุดท้าย</p>
                    <div className="inline-block mt-2 px-5 py-2 rounded-full" style={{ background: 'var(--yellow)', border: '2px solid var(--yellow-deep)' }}>
                        <p className="font-extrabold text-xl" style={{ color: 'var(--text-on-yellow)' }}>🎉 {winP?.name ?? '?'}</p>
                    </div>
                </div>

                <div className="card-elevated p-4 mb-4 slide-up">
                    <p className="section-label text-center mb-3">คำต้องห้ามทั้งหมด</p>
                    <div className="space-y-1.5 stagger-children">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: 'var(--bg-surface)' }}>
                                <div className={`avatar avatar-sm ${p.id === winner ? 'avatar-host' : p.isEliminated ? 'avatar-eliminated' : ACOLORS[i % ACOLORS.length]}`}>
                                    {p.id === winner ? '🏆' : p.isEliminated ? '❌' : p.name[0].toUpperCase()}
                                </div>
                                <span className="font-bold text-sm flex-1 truncate">{p.name}</span>
                                <span className="word-forbidden text-base">{room.words[p.id]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-4"><Soundboard onPlay={handleSound} active={activeSound} /></div>
                <div className="space-y-2">
                    <button className="btn-primary" onClick={handleReset} disabled={resetting}>
                        {resetting ? '⏳ กำลังกลับ...' : '🔄 เล่นรอบใหม่ (กลับล็อบบี้)'}
                    </button>
                    <button className="btn-secondary" onClick={handleQuit} disabled={quitting}>
                        {quitting ? '⏳ ออกจากห้อง...' : '🚪 ออกจากห้อง (กลับหน้าแรก)'}
                    </button>
                </div>
            </div>
        </div>
    );

    // ═══ ELIMINATED ═══
    if (eliminated || myPlayer?.isEliminated) return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
            <div className="fun-bg"><div className="shape" /><div className="shape" /><div className="shape" /><div className="shape" /></div>
            <div className="relative z-10 w-full max-w-sm">
                <div className="text-center mb-4 bounce-in">
                    <div className="text-7xl mb-2">😱</div>
                    <h1 className="font-extrabold text-2xl mb-1" style={{ fontFamily: "'Lilita One', cursive", color: 'var(--pink-deep)' }}>โดนจับได้แล้ว!</h1>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>คุณพูดคำต้องห้ามออกไป</p>
                </div>
                {myWord && (
                    <div className="card-purple p-5 mb-4 text-center">
                        <p className="text-xs font-bold mb-1" style={{ color: 'var(--purple-deep)', opacity: 0.7 }}>คำต้องห้ามของคุณคือ</p>
                        <p className="word-forbidden" style={{ fontSize: '2.5rem' }}>{myWord}</p>
                    </div>
                )}
                <p className="text-center text-xs font-semibold mb-4" style={{ color: 'var(--text-tertiary)' }}>ดูผู้เล่นที่เหลือสู้กันต่อ 👀</p>

                <div className="card-elevated p-4 mb-4">
                    <p className="section-label text-center mb-3">ผู้เล่นที่เหลือ</p>
                    <div className="space-y-1.5 stagger-children">
                        {players.filter(p => !p.isEliminated && p.id !== playerId).map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: 'var(--bg-surface)' }}>
                                <div className={`avatar avatar-sm ${ACOLORS[i % ACOLORS.length]}`}>{p.name[0].toUpperCase()}</div>
                                <span className="font-bold text-sm flex-1 truncate">{p.name}</span>
                                <span className="word-forbidden text-base">{room.words[p.id]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <Soundboard onPlay={handleSound} active={activeSound} />
                <div className="mt-6 space-y-2">
                    <button className="btn-secondary" style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={handleReset} disabled={resetting}>
                        {resetting ? '⏳ กลับล็อบบี้...' : '🏠 กลับไปรอที่ล็อบบี้ (ทุกคนจะถูกพากลับและจบเกมนี้)'}
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--pink-deep)' }} onClick={handleQuit} disabled={quitting}>
                        {quitting ? '⏳ ตัดการเชื่อมต่อ...' : '🚪 ออกจากห้องไปเลย (กลับหน้าแรก)'}
                    </button>
                </div>
            </div>
        </div>
    );

    // ═══ ACTIVE GAME ═══
    return (
        <div className="min-h-dvh flex flex-col max-w-sm mx-auto relative overflow-hidden safe-bottom">
            <div className="fun-bg"><div className="shape" /><div className="shape" /><div className="shape" /><div className="shape" /></div>
            {flashColor && <div className="flash-overlay" style={{ background: `radial-gradient(circle at center, ${flashColor}44, transparent 70%)` }} />}

            <div className="relative z-10 flex flex-col flex-1">
                {/* Header */}
                <div className="px-5 pt-6 pb-3 flex justify-between items-center">
                    <div>
                        <p className="section-label">ห้อง</p>
                        <p style={{ fontFamily: "'Lilita One', cursive", letterSpacing: '0.12em', color: 'var(--purple)', fontSize: '1.3rem' }}>{code}</p>
                    </div>
                    <div className="text-right">
                        <p className="section-label">ยังอยู่</p>
                        <p className="font-extrabold text-lg">
                            <span style={{ color: 'var(--green-deep)' }}>{players.filter(p => !p.isEliminated).length}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>/{players.length}</span>
                        </p>
                    </div>
                </div>

                {/* My secret word */}
                <div className="mx-5 mb-4 card-yellow p-4 text-center no-select">
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-on-yellow)' }}>🤫 คำต้องห้ามของคุณ — อย่าพูดออกมา!</p>
                    <div style={{ display: 'inline-block', padding: '0.4rem 1.5rem', background: 'rgba(0,0,0,0.08)', borderRadius: '12px', filter: 'blur(6px)', fontSize: '1.5rem', letterSpacing: '0.2em', color: 'rgba(0,0,0,0.15)' }}>
                        ????????
                    </div>
                    <p className="text-xs font-semibold mt-2" style={{ color: 'var(--text-on-yellow)', opacity: 0.6 }}>ซ่อนอยู่ — ระวัง!</p>
                </div>

                {/* Players */}
                <div className="px-5 flex-1">
                    <p className="section-label mb-3">คำต้องห้ามของคนอื่น</p>
                    <div className="space-y-2.5 stagger-children">
                        {others.map((p, i) => (
                            <div key={p.id}
                                className={`card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-transform ${p.isEliminated ? 'player-eliminated' : ''}`}
                                style={{ cursor: p.isEliminated ? 'default' : 'pointer' }}
                                onClick={() => !p.isEliminated && setCatchTarget(p)}>
                                <div className={`avatar avatar-md ${p.isEliminated ? 'avatar-eliminated' : ACOLORS[i % ACOLORS.length]}`}>
                                    {p.isEliminated ? '❌' : p.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{p.name}</p>
                                    <p className="text-xs font-semibold" style={{ color: p.isEliminated ? 'var(--text-tertiary)' : 'var(--text-tertiary)' }}>
                                        {p.isEliminated ? 'ถูกจับแล้ว' : 'กำลังเล่น'}
                                    </p>
                                </div>
                                {!p.isEliminated && (
                                    <div className="text-right flex-shrink-0">
                                        <p className="word-forbidden text-lg">{room.words[p.id]}</p>
                                        <span className="badge badge-catch">🤫 แตะจับ</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Soundboard */}
                <div className="px-5 pt-5 pb-4">
                    <Soundboard onPlay={handleSound} active={activeSound} />
                </div>

                {/* Actions */}
                <div className="px-5 pb-6 space-y-2">
                    <button className="btn-secondary" style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }} onClick={handleReset} disabled={resetting}>
                        {resetting ? '⏳ กลับล็อบบี้...' : '🏠 จบรอบนี้และพาทุกคนกลับล็อบบี้'}
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--pink-deep)', background: 'var(--bg-surface)' }} onClick={handleQuit} disabled={quitting}>
                        {quitting ? '⏳ ตัดการเชื่อมต่อ...' : '🚪 ทิ้งเพื่อนแล้วออกจากห้อง (กลับหน้าแรก)'}
                    </button>
                </div>
            </div>

            {/* Catch modal */}
            {catchTarget && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-5"
                    style={{ background: 'rgba(43,39,56,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setCatchTarget(null)}>
                    <div className="card-elevated p-6 w-full max-w-sm pop-in" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-5">
                            <div className="text-5xl mb-3">🫵</div>
                            <h3 className="text-xl font-extrabold">
                                จับ <span style={{ color: 'var(--purple)' }}>{catchTarget.name}</span> ?
                            </h3>
                            <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-secondary)' }}>
                                {catchTarget.name} พูดคำ <span className="word-forbidden">&ldquo;{room.words[catchTarget.id]}&rdquo;</span> จริงๆ?
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
