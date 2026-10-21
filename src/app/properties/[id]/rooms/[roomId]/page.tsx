import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRoom } from '@/actions/room';
import { AddTenantForm } from '@/components/AddTenantForm';
import { DeleteTenantButton } from '@/components/DeleteTenantButton';
import { TenantActiveButton } from '@/components/TenantActiveButton';
import { PageShell } from '@/components/PageShell';
import { formatMonthlyRent } from '@/lib/rent';

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
  const hasActiveTenant = room.tenants.some((t) => t.isActive);

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}/rooms`}>← 返回房間列表</Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ margin: 0 }}>房間詳情</h1>
          {canEdit && (
            <Link href={`/properties/${id}/rooms/${roomId}/edit`} className="btn btn-primary">
              編輯房間
            </Link>
          )}
        </div>
        <table className="table" style={{ marginTop: '1rem' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: '140px' }}>房間名稱</td>
              <td>{room.name}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>月租</td>
              <td>{formatMonthlyRent(room.monthlyRent)}</td>
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
        {canEdit && !hasActiveTenant && <AddTenantForm roomId={roomId} />}
        {canEdit && hasActiveTenant && (
          <p style={{ color: 'var(--muted)' }}>此房間已有在住租客。遷出後才可新增下一位。</p>
        )}
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
                <th>狀態</th>
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
                  <td>{t.isActive ? '在住' : '已遷出'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link href={`/tenants/${t.id}/edit`}>編輯</Link>
                      <span>|</span>
                      <Link href={`/properties/${id}/statements?tenantId=${t.id}`}>檢視租單</Link>
                      {canEdit && t.isActive && (
                        <>
                          <span>|</span>
                          <TenantActiveButton tenantId={t.id} active />
                        </>
                      )}
                      {canEdit && !t.isActive && !hasActiveTenant && (
                        <>
                          <span>|</span>
                          <TenantActiveButton tenantId={t.id} active={false} />
                        </>
                      )}
                      {canEdit && !t.isActive && (
                        <>
                          <span>|</span>
                          <DeleteTenantButton tenantId={t.id} name={t.nameChinese} />
                        </>
                      )}
                    </span>
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
