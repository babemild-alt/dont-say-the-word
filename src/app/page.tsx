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
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
            {/* Animated background blobs */}
            <div
                style={{
                    position: 'fixed', top: '-20%', left: '-20%', width: '60%', height: '60%',
                    background: 'radial-gradient(circle, rgba(255,45,120,0.15) 0%, transparent 70%)',
                    animation: 'bg-drift 15s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed', bottom: '-20%', right: '-20%', width: '60%', height: '60%',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
                    animation: 'bg-drift 20s ease-in-out infinite reverse',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: '40%', height: '40%',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
                    animation: 'bg-drift 25s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-10 float" style={{ animation: 'float 3s ease-in-out infinite' }}>
                    <div className="text-7xl mb-4">🤫</div>
                    <h1
                        className="text-5xl font-bold leading-tight"
                        style={{
                            fontFamily: 'Bangers, cursive',
                            letterSpacing: '0.05em',
                            color: '#fff',
                            textShadow: '0 0 30px rgba(255,45,120,0.6), 0 4px 0 rgba(0,0,0,0.5)',
                        }}
                    >
                        Don&apos;t Say<br />
                        <span style={{ color: '#ff2d78', textShadow: '0 0 40px rgba(255,45,120,0.9), 0 4px 0 rgba(0,0,0,0.5)' }}>
                            the Word!!!
                        </span>
                    </h1>
                    <p className="mt-3 text-white/60 text-sm font-body">
                        เกมปาร์ตี้สุดฮา — อย่าพูดคำต้องห้าม!
                    </p>
                </div>

                {/* Cards */}
                {mode === 'home' && (
                    <div className="space-y-4 pop-in">
                        <button id="btn-create-room" className="btn-primary" onClick={() => setMode('create')}>
                            🎮 สร้างห้องใหม่
                        </button>
                        <button id="btn-join-room" className="btn-secondary" onClick={() => setMode('join')}>
                            🚀 เข้าร่วมห้อง
                        </button>
                    </div>
                )}

                {mode === 'create' && (
                    <div className="glass-card p-6 space-y-4 pop-in">
                        <h2 className="text-xl font-bold text-center">สร้างห้องใหม่</h2>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">ชื่อของคุณ</label>
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
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button id="btn-confirm-create" className="btn-primary" onClick={handleCreate} disabled={loading}>
                            {loading ? '⏳ กำลังสร้างห้อง...' : '✨ สร้างห้อง'}
                        </button>
                        <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>
                            ← กลับ
                        </button>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="glass-card p-6 space-y-4 pop-in">
                        <h2 className="text-xl font-bold text-center">เข้าร่วมห้อง</h2>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">ชื่อของคุณ</label>
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
                            <label className="block text-sm text-white/60 mb-2">รหัสห้อง</label>
                            <input
                                id="input-room-code"
                                className="input-field"
                                placeholder="เช่น AB2X"
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                maxLength={4}
                                style={{ letterSpacing: '0.2em', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'Bangers, cursive' }}
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button id="btn-confirm-join" className="btn-primary" onClick={handleJoin} disabled={loading}>
                            {loading ? '⏳ กำลังเข้าร่วม...' : '🚀 เข้าร่วมห้อง'}
                        </button>
                        <button className="btn-secondary" onClick={() => { setMode('home'); setError(''); }}>
                            ← กลับ
                        </button>
                    </div>
                )}

                <p className="text-center text-white/30 text-xs mt-8">
                    เล่นบนมือถือได้เลย 📱
                </p>
            </div>
        </div>
    );
}
