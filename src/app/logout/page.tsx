'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    try {
      localStorage.removeItem('tgUser');
      localStorage.removeItem('bots');
    } catch {}
    router.replace('/');
  }, [router]);

  return <main style={{ padding: '2rem' }}>Logging out…</main>;
}
