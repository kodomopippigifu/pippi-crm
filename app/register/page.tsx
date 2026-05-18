'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 登録済みなら /api/members にアクセスできるのでホームへ飛ばす
  useEffect(() => {
    fetch('/api/members').then(res => {
      if (res.ok) router.replace('/');
    }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const deviceId = crypto.randomUUID();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || '登録に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌸</div>
          <h1 className="text-xl font-bold text-gray-800">ピッピ 会員管理</h1>
          <p className="text-sm text-gray-500 mt-1">この端末を登録してください</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">登録コード</label>
          <input
            type="password"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 mb-3"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="登録コードを入力"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code}
            className="w-full bg-pink-500 text-white py-2.5 rounded-lg font-medium hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? '登録中...' : 'この端末を登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
