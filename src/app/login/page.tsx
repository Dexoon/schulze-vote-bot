'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export default function LoginPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<TgUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const search = window.location.search;
    if (!search) {
      setStatus('error');
      setMessage('missing auth data');
      return;
    }
    const urlParams = new URLSearchParams(search);
    const secret = urlParams.get('secret');
    const chatId = urlParams.get('chatId');
    
    if (!secret || !chatId) {
      setStatus('error');
      setMessage('missing required parameters');
      return;
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret, chatId: parseInt(chatId, 10) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setUser(data.user);
          setStatus('ok');
          try {
            localStorage.setItem('tgUser', JSON.stringify(data.user));
          } catch {}
          router.replace('/bots');
        } else {
          setStatus('error');
          setMessage(data.error || 'login failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('login failed');
      });
  }, []);

  if (status === 'loading') return <main style={{padding:'2rem'}}>Logging in…</main>;
  if (status === 'error') return <main style={{padding:'2rem'}}>Error: {message}</main>;
  return (
    <main style={{padding:'2rem'}}>
      <h1>Logged in</h1>
      <p>Welcome, {user?.first_name}</p>
    </main>
  );
}

