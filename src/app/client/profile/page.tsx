import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ClientDashboardShell from '@/components/ProfileClientShell';

export default async function ProfileSSRPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/client/login');
  }

  const token = (session as any).accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // 1. 🚀 Fetch FRESH Client Profile from MySQL on every page load (bypasses cookie!)
  let clientProfile = session.user;
  try {
    const profileRes = await fetch(`${API_URL}/api/client/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store', // Always fetch fresh from MySQL!
    });

    if (profileRes.ok) {
      clientProfile = await profileRes.json();
    }
  } catch (err) {
    console.error('Failed to fetch fresh profile:', err);
  }

  // 2. Fetch fresh Orders from MySQL
  let orders = [];
  try {
    const ordersRes = await fetch(`${API_URL}/api/client/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (ordersRes.ok) {
      orders = await ordersRes.json();
    }
  } catch (err) {
    console.error('Failed to fetch orders:', err);
  }

  return (
    <ClientDashboardShell
      session={session}
      clientProfile={clientProfile}
      initialOrders={orders}
    />
  );
}