import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchMenu } from '@/lib/api';
import PosClientShell from '@/components/pos/PosClientShell';
import { redirect } from 'next/navigation';
export const revalidate = 0; // POS terminal requires real-time data

export default async function PosPage() {
  const session = await getServerSession(authOptions);

    if (!session) {
      redirect('/pos/login');
    }
  const products = await fetchMenu();

  return (
    <PosClientShell
      initialProducts={products}
      cashierName={session?.user?.name || 'Cashier Register #1'}
      cashierRole={session?.user?.role || 'Cashier Role'}
      accessToken={(session as any)?.accessToken || null}
    />
  );
}