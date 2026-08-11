import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import PosReservationsClientShell from '@/components/pos/PosReservationsClientShell';

export const revalidate = 0; // POS terminal requires real-time data

export default async function PosReservationsPage() {
  const session = await getServerSession(authOptions);

  // 🚀 Server-side Auth Guard & Redirect
  if (!session) {
    redirect('/pos/login');
  }

  return (
    <PosReservationsClientShell
      cashierName={session?.user?.name || 'Cashier Register #1'}
      cashierRole={(session as any)?.role || 'Cashier Role'}
      accessToken={(session as any)?.accessToken || null}
    />
  );
}