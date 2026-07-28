'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') return null;

  return createPortal(
    <div id="thermal-print-area">{children}</div>,
    document.body
  );
}