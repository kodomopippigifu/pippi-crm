'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface MemberDetail {
  child: Record<string, string>;
  membership: Record<string, string | number> | null;
  guardian: Record<string, string> | null;
  family_members: Record<string, string>[];
  emergency_contacts: Record<string, string>[];
  hospital: Record<string, string> | null;
  allergy: Record<string, string> | null;
  visit_count: number;
}

interface VisitRecord { id: number; visit_date: string; memo: string }

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="info-row flex py-1.5 border-b border-gray-50 last:border-0">
      <span className="info-label text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<MemberDetail | null>(null);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [visitMemo, setVisitMemo] = useState('');
  const [addingVisit, setAddingVisit] = useState(false);

  const load = useCallback(async () => {
    const [memberRes, visitRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch(`/api/members/${id}/visits`),
    ]);
    setData(await memberRes.json());
    setVisits(await visitRes.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirm('この会員を削除しますか？')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    router.push('/members');
  };

  const addVisit = async () => {
    if (!visitDate) return;
    setAddingVisit(true);
    await fetch(`/api/members/${id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visit_date: visitDate, memo: visitMemo }),
    });
    setVisitMemo('');
    await load();
    setAddingVisit(false);
  };

  const deleteVisit = async (visitId: number) => {
    if (!confirm('この来所記録を削除しますか？')) return;
    await fetch(`/api/members/${id}/visits?visitId=${visitId}`, { method: 'DELETE' });
    load();
  };

  const handlePrint = () => window.print();

  if (!data) return <div className="text-center py-20 text-gray-400">読み込み中...</div>;

  const { child, membership, guardian, family_members, emergency_contacts, hospital, allergy } = data;
  const expiryDays = membership?.expiry_date ? daysUntil(membership.expiry_date as string) : null;
  const expiryStatus = expiryDays === null ? null : expiryDays < 0 ? 'expired' : expiryDays <= 30 ? 'expiring' : 'active';

  return (
    <div>
      {/* ヘッダー（画面のみ） */}
      <div className="print-hide flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/members" className="text-gray-400 hover:text-gray-600 text-sm">← 一覧に戻る</Link>
          <h1 className="text-xl font-bold text-gray-800">
            {child.last_name} {child.first_name}
            {child.nickname && <span className="text-base font-normal text-gray-500 ml-2">（{child.nickname}）</span>}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition text-gray-600">🖨️ 印刷</button>
          <Link href={`/members/${id}/edit`} className="text-sm bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition">編集</Link>
          <button onClick={handleDelete} className="text-sm bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition">削除</button>
        </div>
      </div>

      {/* 印刷用タイトル（印刷のみ） */}
      <div className="hidden print-title">
        こどもの国ピッピ 会員情報　{child.last_name} {child.first_name}{child.nickname ? `（${child.nickname}）` : ''}
      </div>

      {/* バナー */}
      {expiryStatus === 'expired' && (
        <div className="alert-banner bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-medium">
          ⚠️ 会員期限が切れています（{membership?.expiry_date}）
        </div>
      )}
      {expiryStatus === 'expiring' && (
        <div className="alert-banner bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 mb-4 text-sm font-medium">
          ⏰ 会員期限まで残り{expiryDays}日です（{membership?.expiry_date}）
        </div>
      )}
      {allergy?.content && (
        <div className="alert-banner bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-3 mb-4 text-sm font-medium">
          ⚠️ アレルギー: {allergy.content}
        </div>
      )}

      {/* 2カラムグリッド */}
      <div className="print-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* お子様情報 */}
        <div className="print-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">👶 お子様情報</h2>
          <InfoRow label="氏名" value={`${child.last_name} ${child.first_name}`} />
          <InfoRow label="ふりがな" value={`${child.last_name_kana || ''} ${child.first_name_kana || ''}`} />
          <div className="info-row flex py-1.5 border-b border-gray-50 items-center">
            <span className="info-label text-xs text-gray-500 w-28 shrink-0">生年月日</span>
            <span className="text-sm text-gray-800 flex items-center gap-1.5">
              {child.birth_date || '—'}
              {child.birth_date && new Date(child.birth_date).getMonth() === new Date().getMonth() && (
                <span className="animate-pulse font-bold" style={{filter:'drop-shadow(0 0 8px #f59e0b) drop-shadow(0 0 16px #fbbf24)', fontSize:'1.1rem'}}>🎂</span>
              )}
            </span>
          </div>
          <InfoRow label="性別" value={child.gender} />
          <InfoRow label="血液型" value={child.blood_type} />
          <InfoRow label="家での呼び名" value={child.nickname} />
        </div>

        {/* 会員情報 */}
        <div className="print-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">📋 会員情報</h2>
          <InfoRow label="会員種別" value={membership?.membership_type as string} />
          <InfoRow label="入会日" value={membership?.join_date as string} />
          <InfoRow label="有効期限" value={membership?.expiry_date as string} />
          <InfoRow label="来所回数" value={`${data.visit_count} 回`} />
          {membership?.notes && <InfoRow label="備考" value={membership.notes as string} />}
        </div>

        {/* 保護者情報 + 緊急連絡先 */}
        <div className="print-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">👨‍👩‍👧 保護者情報</h2>
          <InfoRow label="氏名" value={guardian ? `${guardian.last_name} ${guardian.first_name}` : ''} />
          <InfoRow label="生年月日" value={guardian?.birth_date} />
          <InfoRow label="住所" value={guardian?.address} />
          <InfoRow label="携帯電話" value={guardian?.mobile_phone} />
          <InfoRow label="自宅電話" value={guardian?.home_phone} />
          {emergency_contacts.length > 0 && <>
            <h2 className="text-sm font-bold text-pink-600 mt-3 mb-2 border-b border-pink-100 pb-1">🚨 緊急連絡先</h2>
            {emergency_contacts.map(ec => (
              <InfoRow key={ec.id} label={`第${ec.order_num}連絡先`} value={`${ec.name}　${ec.phone}`} />
            ))}
          </>}
        </div>

        {/* かかりつけ医 + アレルギー + 備考 */}
        <div className="print-card bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">🏥 かかりつけ医</h2>
          <InfoRow label="病院名" value={hospital?.hospital_name} />
          <InfoRow label="電話番号" value={hospital?.phone} />
          <h2 className="text-sm font-bold text-pink-600 mt-3 mb-2 border-b border-pink-100 pb-1">⚠️ アレルギー・備考</h2>
          {allergy?.content
            ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{allergy.content}</p>
            : <p className="text-sm text-gray-400">なし</p>
          }
          {membership?.notes && <>
            <h2 className="text-sm font-bold text-pink-600 mt-3 mb-2 border-b border-pink-100 pb-1">📝 会員備考</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{membership.notes as string}</p>
          </>}
        </div>
      </div>

      {/* 家族構成 */}
      {family_members.length > 0 && (
        <div className="print-card bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4">
          <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">👨‍👩‍👧‍👦 家族構成</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="text-left pb-2">氏名</th>
                <th className="text-left pb-2">続柄</th>
                <th className="text-left pb-2">生年月日</th>
                <th className="text-left pb-2">年齢</th>
                <th className="text-left pb-2">職業・在学校</th>
              </tr>
            </thead>
            <tbody>
              {family_members.map(fm => (
                <tr key={fm.id} className="border-t border-gray-50">
                  <td className="py-1.5">{fm.name}</td>
                  <td>{fm.relationship}</td>
                  <td>{fm.birth_date}</td>
                  <td>{fm.age ? `${fm.age}歳` : ''}</td>
                  <td>{fm.occupation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 来所記録 */}
      <div className="print-hide bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4">
        <h2 className="text-sm font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">📅 来所記録</h2>
        <div className="flex gap-2 mb-4">
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-300" placeholder="メモ（任意）" value={visitMemo} onChange={e => setVisitMemo(e.target.value)} />
          <button onClick={addVisit} disabled={addingVisit} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50 transition">記録</button>
        </div>
        {visits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">来所記録がありません</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {visits.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-600 font-medium w-28">{v.visit_date}</span>
                <span className="text-gray-500 flex-1">{v.memo || ''}</span>
                <button onClick={() => deleteVisit(v.id)} className="text-red-400 hover:text-red-600 text-xs px-2">削除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
