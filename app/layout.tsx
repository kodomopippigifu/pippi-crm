import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'こどもの国ピッピ 顧客管理',
  description: '会員管理システム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-pink-500 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="text-xl font-bold tracking-wide whitespace-nowrap">
              🌸 ピッピ 会員管理
            </Link>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:bg-pink-600 px-3 py-1 rounded transition">ダッシュボード</Link>
              <Link href="/members" className="hover:bg-pink-600 px-3 py-1 rounded transition">会員一覧</Link>
              <Link href="/members/new" className="bg-white text-pink-600 px-3 py-1 rounded hover:bg-pink-50 transition">＋ 新規登録</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
