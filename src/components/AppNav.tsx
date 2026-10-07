import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export function AppNav({
  role,
  propertyId,
}: {
  role?: string;
  propertyId?: string;
}) {
  const roomsHref = propertyId ? `/properties/${propertyId}/rooms` : '/rooms';
  const statementsHref = propertyId ? `/properties/${propertyId}/statements` : '/statements';

  return (
    <nav className="nav">
      <Link href="/">首頁</Link>
      <Link href="/properties">物業管理</Link>
      <Link href={roomsHref}>房間管理</Link>
      <Link href={statementsHref}>租單管理</Link>
      {role === 'ADMIN' && <Link href="/admin/users">用戶管理</Link>}
      {role === 'ADMIN' && <Link href="/admin/search">搜尋管理</Link>}
      <LogoutButton />
    </nav>
  );
}
