import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRoom } from '@/actions/room';
import { AddTenantForm } from '@/components/AddTenantForm';
import { PageShell } from '@/components/PageShell';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>;
}) {
  const { id, roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room || room.propertyId !== id) notFound();

  const canEdit = room.property.owners.some((o) => o.userId === session?.id) || session?.role === 'ADMIN';

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}/rooms`}>← 返回房間列表</Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h1>房間詳情</h1>
        <table className="table" style={{ marginTop: '1rem' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: '140px' }}>房間名稱</td>
              <td>{room.name}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>月租</td>
              <td>${Number(room.monthlyRent).toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>物業</td>
              <td>{room.property.addressChinese}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>租客</h2>
        {canEdit && <AddTenantForm roomId={roomId} />}
        {room.tenants.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>尚無租客</p>
        ) : (
          <table className="table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>姓名（中文）</th>
                <th>姓名（英文）</th>
                <th>電話</th>
                <th>護照/身份證</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {room.tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.nameChinese}</td>
                  <td>{t.nameEnglish}</td>
                  <td>{t.phone}</td>
                  <td>{t.passportOrHkid || '-'}</td>
                  <td>
                    <Link href={`/properties/${id}/statements?tenantId=${t.id}`}>檢視租單</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href={`/properties/${id}/statements?roomId=${roomId}`} className="btn btn-primary">
          租單管理
        </Link>
      </div>
    </PageShell>
  );
}
