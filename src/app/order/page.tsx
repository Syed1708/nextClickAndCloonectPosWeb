import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchMenu } from '@/lib/api';
import OrderClientShell from '@/components/OrderClientShell';

export const revalidate = 60; // SSR Incremental Static Regeneration

export default async function OrderPage() {
  // 1. Fetch NextAuth Session instantly on the Server (SSR)
  const session = await getServerSession(authOptions);

  // 2. Fetch Menu directly on the Server (SSR)
  const initialProducts = await fetchMenu();

  // 3. Pass authenticated state & access token directly as props!
  return (
    <OrderClientShell
      initialProducts={initialProducts}
      isLoggedIn={!!session}
      accessToken={(session as any)?.accessToken || null}
      userName={session?.user?.name || null}
      initialPoints={(session?.user as any)?.loyaltyPoints || 0} 
    />
  );
}