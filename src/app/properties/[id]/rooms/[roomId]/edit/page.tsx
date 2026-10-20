import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRoom } from '@/actions/room';
import { CreateRoomForm } from '@/components/CreateRoomForm';
import { PageShell } from '@/components/PageShell';

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>;
}) {
  const { id, roomId } = await params;
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room || room.propertyId !== id) notFound();

  return (
    <PageShell role={session?.role} propertyId={id}>
      <div style={{ marginTop: '1rem' }}>
        <Link href={`/properties/${id}/rooms/${roomId}`}>← 返回房間詳情</Link>
      </div>

      <h1 style={{ marginTop: '1rem' }}>編輯房間</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
        {room.property.addressChinese}
      </p>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <CreateRoomForm
          propertyId={id}
          room={{
            id: room.id,
            name: room.name,
            monthlyRent: room.monthlyRent,
          }}
        />
      </div>
    </PageShell>
  );
}
