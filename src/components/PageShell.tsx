import { AppNav } from '@/components/AppNav';

export function PageShell({
  children,
  role,
  propertyId,
}: {
  children: React.ReactNode;
  role?: string;
  propertyId?: string;
}) {
  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <AppNav role={role} propertyId={propertyId} />
      {children}
    </div>
  );
}
