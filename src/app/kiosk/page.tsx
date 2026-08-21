import { fetchMenu } from '@/lib/api';
import KioskClientShell from '@/components/kiosk/KioskClientShell';

export const revalidate = 0; // Kiosk requires real-time product menu

export default async function KioskPage() {
  const initialProducts = await fetchMenu();

  return <KioskClientShell initialProducts={initialProducts} />;
}