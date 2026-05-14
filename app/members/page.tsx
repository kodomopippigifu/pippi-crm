'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Member {
  id: number; last_name: string; first_name: string; last_name_kana: string; first_name_kana: string;
  nickname: string; birth_date: string; gender: string; blood_type: string;
  membership_type: string; join_date: string; expiry_date: string; is_renewal: number;
  mobile_phone: string; address: string; guardian_last: string; guardian_first: string;
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

function StatusBadge({ expiry }: { expiry: string }) {
  if (!expiry) return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">期限なし</span>;
  const d = daysUntil(expiry);
  if (d < 0) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">期限切れ</span>;
  if (d <= 30) return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">残{d}日</span>;
  return <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">有効</span>;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/members?${params}`);
    setMembers(await res.json());
    setLoading(false);
  }, [q, statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name} を削除しますか？`)) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">会員一覧</h1>
        <Link href="/members/new" className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition">＋ 新規登録</Link>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-pink-300"
          placeholder="氏名・ふりがなで検索..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="active">有効</option>
          <option value="expiring">30日以内に期限切れ</option>
          <option value="expired">期限切れ</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{members.length} 件</span>
      </div>

      {/* 一覧テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">読み込み中...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">該当する会員が見つかりません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pink-50 text-gray-600 text-xs">
              <tr>
                <th className="text-left px-4 py-3">お子様</th>
                <th className="text-left px-4 py-3">保護者</th>
                <th className="text-left px-4 py-3">会員種別</th>
                <th className="text-left px-4 py-3">有効期限</th>
                <th className="text-left px-4 py-3">状態</th>
                <th className="text-left px-4 py-3">携帯</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className={`border-t border-gray-50 hover:bg-pink-50/30 transition ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3">
                    <Link href={`/members/${m.id}`} className="font-medium text-pink-600 hover:underline">
                      {m.last_name} {m.first_name}
                    </Link>
                    {m.nickname && <span className="text-gray-400 text-xs ml-1">（{m.nickname}）</span>}
                    {m.last_name_kana && <div className="text-xs text-gray-400">{m.last_name_kana} {m.first_name_kana}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.guardian_last} {m.guardian_first}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.membership_type === '月会員' ? 'bg-blue-100 text-blue-600' : m.membership_type === '年会員' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                      {m.membership_type || '未設定'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{m.expiry_date || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge expiry={m.expiry_date} /></td>
                  <td className="px-4 py-3 text-gray-600">{m.mobile_phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/members/${m.id}`} className="text-xs text-gray-500 hover:text-pink-600 border border-gray-200 rounded px-2 py-1">詳細</Link>
                      <Link href={`/members/${m.id}/edit`} className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1">編集</Link>
                      <button onClick={() => handleDelete(m.id, `${m.last_name} ${m.first_name}`)} className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded px-2 py-1">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
