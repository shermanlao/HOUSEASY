import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

/** Logged-in users land on the properties dashboard (not an empty welcome shell). */
export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  redirect('/properties');
}
