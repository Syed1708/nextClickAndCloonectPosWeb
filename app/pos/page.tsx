import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchMenu } from '../lib/api';
import PosClientShell from '../components/pos/PosClientShell';
export const revalidate = 0; // POS terminal requires real-time data

export default async function PosPage() {
  const session = await getServerSession(authOptions);
  const products = await fetchMenu();

  return (
    <PosClientShell
      initialProducts={products}
      cashierName={session?.user?.name || 'Cashier Register #1'}
      accessToken={(session as any)?.accessToken || null}
    />
  );
}