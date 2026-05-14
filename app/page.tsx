'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  total: number;
  expired: number;
  expiring: number;
  expiringList: { id: number; last_name: string; first_name: string; nickname: string; expiry_date: string; membership_type: string; mobile_phone: string }[];
  expiredList: { id: number; last_name: string; first_name: string; nickname: string; expiry_date: string; membership_type: string; mobile_phone: string }[];
  recentVisits: { visit_date: string; memo: string; last_name: string; first_name: string; child_id: number }[];
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-center py-20 text-gray-400">読み込み中...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-3xl font-bold text-pink-500">{data.total}</div>
          <div className="text-sm text-gray-500 mt-1">総会員数</div>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 text-center ${data.expiring > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
          <div className={`text-3xl font-bold ${data.expiring > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{data.expiring}</div>
          <div className="text-sm text-gray-500 mt-1">30日以内に期限切れ</div>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 text-center ${data.expired > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className={`text-3xl font-bold ${data.expired > 0 ? 'text-red-500' : 'text-gray-400'}`}>{data.expired}</div>
          <div className="text-sm text-gray-500 mt-1">期限切れ</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 期限切れ間近 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-yellow-600 mb-3 flex items-center gap-2">
            ⏰ 期限切れ間近（30日以内）
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{data.expiring}件</span>
          </h2>
          {data.expiringList.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">該当なし</p>
          ) : (
            <div className="space-y-2">
              {data.expiringList.map(m => (
                <Link key={m.id} href={`/members/${m.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-yellow-50 transition group">
                  <div>
                    <span className="text-sm font-medium text-gray-800 group-hover:text-yellow-700">
                      {m.last_name} {m.first_name}
                    </span>
                    {m.nickname && <span className="text-xs text-gray-400 ml-1">（{m.nickname}）</span>}
                    <div className="text-xs text-gray-400">{m.mobile_phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-600 font-medium">残{daysUntil(m.expiry_date)}日</div>
                    <div className="text-xs text-gray-400">{m.expiry_date}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近の来所記録 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
          <h2 className="text-sm font-bold text-pink-600 mb-3">📅 最近の来所記録</h2>
          {data.recentVisits.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">来所記録がありません</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentVisits.map((v, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <span className="text-xs text-gray-400 w-24">{v.visit_date}</span>
                  <Link href={`/members/${v.child_id}`} className="text-sm font-medium text-pink-600 hover:underline w-24">
                    {v.last_name} {v.first_name}
                  </Link>
                  <span className="text-sm text-gray-500">{v.memo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/members/new" className="bg-pink-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-pink-600 transition">＋ 新規会員登録</Link>
        <Link href="/members" className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">会員一覧を見る</Link>
      </div>
    </div>
  );
}
