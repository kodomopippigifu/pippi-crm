'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MemberForm from '@/components/MemberForm';
import Link from 'next/link';

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/members/${id}`).then(r => r.json()).then(data => {
      const { child, membership, guardian, family_members, emergency_contacts, hospital, allergy } = data;
      setInitial({
        ...child,
        membership_type: membership?.membership_type || '月会員',
        join_date: membership?.join_date || '',
        expiry_date: membership?.expiry_date || '',
        is_renewal: !!membership?.is_renewal,
        membership_notes: membership?.notes || '',
        guardian: guardian || { last_name: '', first_name: '', gender: '女', birth_date: '', address: '', home_phone: '', mobile_phone: '', workplace_name: '', workplace_phone: '' },
        family_members: family_members?.length ? family_members : [
          { name: '', relationship: '父', birth_date: '', age: '', occupation: '' },
          { name: '', relationship: '母', birth_date: '', age: '', occupation: '' },
        ],
        emergency_contacts: emergency_contacts?.length ? emergency_contacts : [
          { order_num: 1, name: '', phone: '' },
          { order_num: 2, name: '', phone: '' },
        ],
        hospital_name: hospital?.hospital_name || '',
        hospital_phone: hospital?.phone || '',
        allergy_notes: allergy?.content || '',
      });
    });
  }, [id]);

  if (!initial) return <div className="text-center py-20 text-gray-400">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/members/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← 詳細に戻る</Link>
        <h1 className="text-xl font-bold text-gray-800">会員情報の編集</h1>
      </div>
      <MemberForm initial={initial as Parameters<typeof MemberForm>[0]['initial']} memberId={Number(id)} />
    </div>
  );
}
