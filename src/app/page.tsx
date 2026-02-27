'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!playerName.trim()) { setError('กรุณาใส่ชื่อของคุณ'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/rooms/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); setLoading(false); return; }
            sessionStorage.setItem('playerId', data.playerId);
            sessionStorage.setItem('playerName', playerName.trim());
            sessionStorage.setItem('tokenRequest', JSON.stringify(data.tokenRequest));
            router.push(`/room/${data.room.code}/lobby`);
        } catch {
            setError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!playerName.trim()) { setError('กรุณาใส่ชื่อของคุณ'); return; }
        if (!roomCode.trim()) { setError('กรุณาใส่รหัสห้อง'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim(), roomCode: roomCode.trim().toUpperCase() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); setLoading(false); return; }
            sessionStorage.setItem('playerId', data.playerId);
            sessionStorage.setItem('playerName', playerName.trim());
            sessionStorage.setItem('tokenRequest', JSON.stringify(data.tokenRequest));
            router.push(`/room/${data.room.code}/lobby`);
        } catch {
            setError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative">
            {/* Ambient */}
            <div className="ambient-bg">
                <div className="ambient-blob" />
                <div className="ambient-blob" />
                <div className="ambient-blob" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="text-6xl mb-5 float" style={{ animationDuration: '2.5s' }}>🤫</div>
                    <h1 className="game-title mb-3">
                        Don&apos;t Say<br />
                        <span className="accent">the Word!!!</span>
                    </h1>
                    <p className="game-subtitle">เกมปาร์ตี้สุดฮา — อย่าพูดคำต้องห้าม!</p>
                </div>

                {/* Home Actions */}
                {mode === 'home' && (
                    <div className="space-y-3 pop-in">
                        <button id="btn-create-room" className="btn-primary" onClick={() => setMode('create')}>
                            🎮&nbsp; สร้างห้องใหม่
                        </button>
                        <button id="btn-join-room" className="btn-secondary" onClick={() => setMode('join')}>
                            🚀&nbsp; เข้าร่วมห้อง
                        </button>
                        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
                            เล่นบนมือถือได้เลย 📱
                        </p>
                    </div>
                )}

                {/* Create Room */}
                {mode === 'create' && (
                    <div className="glass-elevated p-6 pop-in">
                        <h2 className="text-lg font-bold text-center mb-5">สร้างห้องใหม่</h2>
                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                ชื่อของคุณ
                            </label>
                            <input
                                id="input-player-name-create"
                                className="input-field"
                                placeholder="ใส่ชื่อเล่นของคุณ..."
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                maxLength={20}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-center mb-3 py-2 px-3 rounded-xl"
                                style={{ background: 'rgba(255,45,120,0.1)', color: 'var(--pink)' }}>
                                {error}
                            </p>
                        )}
                        <div className="space-y-2">
                            <button id="btn-confirm-create" className="btn-primary" onClick={handleCreate} disabled={loading}>
                                {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างห้อง'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>
                                ← กลับ
                            </button>
                        </div>
                    </div>
                )}

                {/* Join Room */}
                {mode === 'join' && (
                    <div className="glass-elevated p-6 pop-in">
                        <h2 className="text-lg font-bold text-center mb-5">เข้าร่วมห้อง</h2>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    ชื่อของคุณ
                                </label>
                                <input
                                    id="input-player-name-join"
                                    className="input-field"
                                    placeholder="ใส่ชื่อเล่นของคุณ..."
                                    value={playerName}
                                    onChange={e => setPlayerName(e.target.value)}
                                    maxLength={20}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    รหัสห้อง
                                </label>
                                <input
                                    id="input-room-code"
                                    className="input-field"
                                    placeholder="เช่น AB2X"
                                    value={roomCode}
                                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                    maxLength={4}
                                    style={{
                                        letterSpacing: '0.3em', fontSize: '1.6rem', textAlign: 'center',
                                        fontFamily: 'Bangers, cursive', padding: '0.75rem',
                                    }}
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-center mb-3 py-2 px-3 rounded-xl"
                                style={{ background: 'rgba(255,45,120,0.1)', color: 'var(--pink)' }}>
                                {error}
                            </p>
                        )}
                        <div className="space-y-2">
                            <button id="btn-confirm-join" className="btn-primary" onClick={handleJoin} disabled={loading}>
                                {loading ? '⏳ กำลังเข้าร่วม...' : '🚀 เข้าร่วมห้อง'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>
                                ← กลับ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
