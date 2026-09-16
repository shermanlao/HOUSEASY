import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { CreatePropertyForm } from '../CreatePropertyForm';

export default async function NewPropertyPage() {
  const session = await getSession();

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <nav className="nav">
        <Link href="/">首頁</Link>
        <Link href="/properties">物業管理</Link>
        {session?.role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
        <Link href="/logout">登出</Link>
      </nav>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/properties">← 返回物業列表</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>新增物業</h1>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreatePropertyForm />
      </div>
    </div>
  );
}
