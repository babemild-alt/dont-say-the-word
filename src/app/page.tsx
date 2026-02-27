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
        } catch { setError('เกิดข้อผิดพลาด ลองใหม่'); setLoading(false); }
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
        } catch { setError('เกิดข้อผิดพลาด ลองใหม่'); setLoading(false); }
    };

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
            {/* Fun Background */}
            <div className="fun-bg">
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
                <div className="shape" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo & Title */}
                <div className="text-center mb-10 pop-in">
                    <div className="text-7xl mb-4 float" style={{ animationDuration: '2.2s' }}>🤫</div>
                    <h1 className="game-title mb-2">
                        Don&apos;t Say<br />
                        <span className="accent">the Word!!!</span>
                    </h1>
                    <p className="game-subtitle">เกมปาร์ตี้สุดฮา — อย่าพูดคำต้องห้าม!</p>
                </div>

                {/* Home */}
                {mode === 'home' && (
                    <div className="space-y-3 pop-in" style={{ animationDelay: '100ms' }}>
                        <button id="btn-create-room" className="btn-primary" onClick={() => setMode('create')}>
                            🎮 สร้างห้องใหม่
                        </button>
                        <button id="btn-join-room" className="btn-secondary" onClick={() => setMode('join')}>
                            🚀 เข้าร่วมห้อง
                        </button>
                        <div className="text-center mt-6">
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                                เล่นกับเพื่อนบนมือถือ 📱
                            </p>
                        </div>
                    </div>
                )}

                {/* Create */}
                {mode === 'create' && (
                    <div className="card-elevated p-6 pop-in">
                        <h2 className="text-lg font-extrabold text-center mb-1">สร้างห้องใหม่</h2>
                        <p className="text-center text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>ตั้งชื่อเล่นแล้วเริ่มเกม!</p>
                        <div className="mb-4">
                            <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>ชื่อของคุณ</label>
                            <input
                                className="input-field"
                                placeholder="ใส่ชื่อเล่น..."
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                maxLength={20}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-center mb-3 py-2 px-3 rounded-xl" style={{ background: 'var(--pink-light)', color: 'var(--pink-deep)', fontWeight: 700 }}>
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                                {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างห้อง'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>← กลับ</button>
                        </div>
                    </div>
                )}

                {/* Join */}
                {mode === 'join' && (
                    <div className="card-elevated p-6 pop-in">
                        <h2 className="text-lg font-extrabold text-center mb-1">เข้าร่วมห้อง</h2>
                        <p className="text-center text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>ใส่รหัสที่เพื่อนส่งมา!</p>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>ชื่อของคุณ</label>
                                <input className="input-field" placeholder="ใส่ชื่อเล่น..." value={playerName}
                                    onChange={e => setPlayerName(e.target.value)} maxLength={20} autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>รหัสห้อง</label>
                                <input className="input-field" placeholder="เช่น AB2X" value={roomCode}
                                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                    maxLength={4}
                                    style={{ letterSpacing: '0.3em', fontSize: '1.8rem', textAlign: 'center', fontFamily: "'Lilita One', cursive", padding: '0.75rem' }}
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-center mb-3 py-2 px-3 rounded-xl" style={{ background: 'var(--pink-light)', color: 'var(--pink-deep)', fontWeight: 700 }}>
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <button className="btn-purple" onClick={handleJoin} disabled={loading}>
                                {loading ? '⏳ กำลังเข้าร่วม...' : '🚀 เข้าร่วมห้อง'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>← กลับ</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
