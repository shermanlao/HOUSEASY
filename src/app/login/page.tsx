import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/properties');
  return (
    <div className="container" style={{ paddingTop: '4rem', maxWidth: '400px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem' }}>登入</h1>
        <LoginForm />
      </div>
    </div>
  );
}
