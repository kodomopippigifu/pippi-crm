'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FamilyMember { name: string; relationship: string; birth_date: string; age: string; occupation: string }
interface EmergencyContact { order_num: number; name: string; phone: string }

interface FormData {
  last_name: string; first_name: string; last_name_kana: string; first_name_kana: string;
  nickname: string; birth_date: string; gender: string; blood_type: string;
  membership_type: string; join_date: string; expiry_date: string; is_renewal: boolean; membership_notes: string;
  guardian: { last_name: string; first_name: string; gender: string; birth_date: string; address: string; home_phone: string; mobile_phone: string; workplace_name: string; workplace_phone: string };
  family_members: FamilyMember[];
  emergency_contacts: EmergencyContact[];
  hospital_name: string; hospital_phone: string;
  allergy_notes: string;
}

const defaultForm = (): FormData => ({
  last_name: '', first_name: '', last_name_kana: '', first_name_kana: '',
  nickname: '', birth_date: '', gender: '男', blood_type: '',
  membership_type: '月会員', join_date: '', expiry_date: '', is_renewal: false, membership_notes: '',
  guardian: { last_name: '', first_name: '', gender: '女', birth_date: '', address: '', home_phone: '', mobile_phone: '', workplace_name: '', workplace_phone: '' },
  family_members: [
    { name: '', relationship: '父', birth_date: '', age: '', occupation: '' },
    { name: '', relationship: '母', birth_date: '', age: '', occupation: '' },
  ],
  emergency_contacts: [
    { order_num: 1, name: '', phone: '' },
    { order_num: 2, name: '', phone: '' },
  ],
  hospital_name: '', hospital_phone: '',
  allergy_notes: '',
});

export default function MemberForm({ initial, memberId }: { initial?: Partial<FormData>; memberId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...defaultForm(), ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormData, value: unknown) => setForm(f => ({ ...f, [key]: value }));
  const setGuardian = (key: string, value: string) => setForm(f => ({ ...f, guardian: { ...f.guardian, [key]: value } }));
  const setFM = (i: number, key: string, value: string) => setForm(f => {
    const fms = [...f.family_members];
    fms[i] = { ...fms[i], [key]: value };
    return { ...f, family_members: fms };
  });
  const setEC = (i: number, key: string, value: string) => setForm(f => {
    const ecs = [...f.emergency_contacts];
    ecs[i] = { ...ecs[i], [key]: value };
    return { ...f, emergency_contacts: ecs };
  });

  const addFM = () => setForm(f => ({ ...f, family_members: [...f.family_members, { name: '', relationship: '子', birth_date: '', age: '', occupation: '' }] }));
  const removeFM = (i: number) => setForm(f => ({ ...f, family_members: f.family_members.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.last_name || !form.first_name) { setError('お子様の氏名は必須です'); return; }
    setSaving(true);
    setError('');
    try {
      const url = memberId ? `/api/members/${memberId}` : '/api/members';
      const method = memberId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('保存失敗');
      const data = await res.json();
      router.push(`/members/${memberId ?? data.id}`);
    } catch {
      setError('保存中にエラーが発生しました');
      setSaving(false);
    }
  };

  const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-pink-300';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-0.5';
  const sectionCls = 'bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 border border-red-200 rounded p-3 text-sm">{error}</div>}

      {/* 入会情報 */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">📋 入会情報</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>会員種別</label>
            <select className={inputCls} value={form.membership_type} onChange={e => {
              const type = e.target.value;
              set('membership_type', type);
              if (form.join_date) {
                const d = new Date(form.join_date);
                if (type === '月会員') { d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() - 1); set('expiry_date', d.toISOString().slice(0, 10)); }
                else if (type === '年会員') { d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); set('expiry_date', d.toISOString().slice(0, 10)); }
                else { set('expiry_date', ''); }
              }
            }}>
              <option>月会員</option>
              <option>年会員</option>
              <option>ビジター</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>開始日</label>
            <input type="date" className={inputCls} value={form.join_date} onChange={e => {
              const d = new Date(e.target.value);
              set('join_date', e.target.value);
              if (e.target.value) {
                if (form.membership_type === '月会員') { d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() - 1); set('expiry_date', d.toISOString().slice(0, 10)); }
                else if (form.membership_type === '年会員') { d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); set('expiry_date', d.toISOString().slice(0, 10)); }
                else { set('expiry_date', ''); }
              }
            }} />
          </div>
          <div>
            <label className={labelCls}>有効期限（自動）</label>
            <input type="date" className={inputCls + ' bg-gray-50 text-gray-500'} value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </div>
        </div>
      </div>

      {/* お子様情報 */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">👶 お子様情報</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className={labelCls}>姓 <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="子供" />
          </div>
          <div>
            <label className={labelCls}>名 <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="太郎" />
          </div>
          <div>
            <label className={labelCls}>姓（ふりがな）</label>
            <input className={inputCls} value={form.last_name_kana} onChange={e => set('last_name_kana', e.target.value)} placeholder="こども" />
          </div>
          <div>
            <label className={labelCls}>名（ふりがな）</label>
            <input className={inputCls} value={form.first_name_kana} onChange={e => set('first_name_kana', e.target.value)} placeholder="たろう" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>家での呼び名</label>
            <input className={inputCls} value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder="" />
          </div>
          <div>
            <label className={labelCls}>生年月日</label>
            <input type="date" className={inputCls} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>性別</label>
            <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option>男</option>
              <option>女</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>血液型</label>
            <select className={inputCls} value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
              <option value="">不明</option>
              <option>A</option>
              <option>B</option>
              <option>O</option>
              <option>AB</option>
            </select>
          </div>
        </div>
      </div>

      {/* 保護者情報 */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">👨‍👩‍👧 保護者情報</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className={labelCls}>姓</label>
            <input className={inputCls} value={form.guardian.last_name} onChange={e => setGuardian('last_name', e.target.value)} placeholder="子供" />
          </div>
          <div>
            <label className={labelCls}>名</label>
            <input className={inputCls} value={form.guardian.first_name} onChange={e => setGuardian('first_name', e.target.value)} placeholder="太郎" />
          </div>
          <div>
            <label className={labelCls}>性別</label>
            <select className={inputCls} value={form.guardian.gender} onChange={e => setGuardian('gender', e.target.value)}>
              <option>女</option><option>男</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>生年月日</label>
            <input type="date" className={inputCls} value={form.guardian.birth_date} onChange={e => setGuardian('birth_date', e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label className={labelCls}>住所</label>
          <input className={inputCls} value={form.guardian.address} onChange={e => setGuardian('address', e.target.value)} placeholder="大垣市" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>携帯電話</label>
            <input className={inputCls} value={form.guardian.mobile_phone} onChange={e => setGuardian('mobile_phone', e.target.value)} placeholder="080-0000-0000" />
          </div>
          <div>
            <label className={labelCls}>自宅電話</label>
            <input className={inputCls} value={form.guardian.home_phone} onChange={e => setGuardian('home_phone', e.target.value)} />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-pink-50">
          <p className="text-xs font-medium text-gray-600 mb-2">🚨 緊急連絡先</p>
          <div className="space-y-2">
            {form.emergency_contacts.map((ec, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 items-center">
                <label className="text-sm text-gray-500">{i === 0 ? '第一' : '第二'}連絡先</label>
                <input className={inputCls} value={ec.name} onChange={e => setEC(i, 'name', e.target.value)} placeholder="氏名" />
                <input className={inputCls} value={ec.phone} onChange={e => setEC(i, 'phone', e.target.value)} placeholder="電話番号" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 家族構成 */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-3 border-b border-pink-100 pb-2">
          <h2 className="text-base font-bold text-pink-600">👨‍👩‍👧‍👦 家族構成</h2>
          <button type="button" onClick={addFM} className="text-xs bg-pink-50 text-pink-600 border border-pink-200 rounded px-2 py-1 hover:bg-pink-100">＋ 追加</button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 mb-1">
            <span>氏名</span><span>続柄</span><span>生年月日</span><span>年齢</span><span>職業・在学校</span>
          </div>
          {form.family_members.map((fm, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center">
              <input className={inputCls} value={fm.name} onChange={e => setFM(i, 'name', e.target.value)} />
              <select className={inputCls} value={fm.relationship} onChange={e => setFM(i, 'relationship', e.target.value)}>
                {['父','母','子','祖父','祖母','兄','姉','弟','妹','その他'].map(r => <option key={r}>{r}</option>)}
              </select>
              <input type="date" className={inputCls} value={fm.birth_date} onChange={e => setFM(i, 'birth_date', e.target.value)} />
              <input type="number" className={inputCls} value={fm.age} onChange={e => setFM(i, 'age', e.target.value)} placeholder="歳" />
              <div className="flex gap-1">
                <input className={inputCls} value={fm.occupation} onChange={e => setFM(i, 'occupation', e.target.value)} />
                {i > 1 && <button type="button" onClick={() => removeFM(i)} className="text-red-400 hover:text-red-600 text-lg px-1">×</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* かかりつけ病院 */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">🏥 かかりつけ病院</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>病院名</label>
            <input className={inputCls} value={form.hospital_name} onChange={e => set('hospital_name', e.target.value)} placeholder="こども小児科" />
          </div>
          <div>
            <label className={labelCls}>電話番号</label>
            <input className={inputCls} value={form.hospital_phone} onChange={e => set('hospital_phone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* アレルギー・備考 */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold text-pink-600 mb-3 border-b border-pink-100 pb-2">⚠️ アレルギー・備考</h2>
        <textarea className={inputCls + ' min-h-[80px] resize-y'} value={form.allergy_notes} onChange={e => set('allergy_notes', e.target.value)} placeholder="例：卵アレルギーあります" />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm">キャンセル</button>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition text-sm font-medium">
          {saving ? '保存中...' : memberId ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  );
}
