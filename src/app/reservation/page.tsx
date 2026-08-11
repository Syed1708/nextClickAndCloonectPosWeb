import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ReservationClientShell from '@/components/client/ReservationClientShell';

export const revalidate = 60; // SSR ISR revalidation

export default async function ReservationPage() {
  const session = await getServerSession(authOptions);

  return (
    <ReservationClientShell
      isLoggedIn={!!session}
      accessToken={(session as any)?.accessToken || null}
      user={{
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: (session?.user as any)?.phone || '',
      }}
    />
  );
}