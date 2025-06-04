'use client';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const params = window.location.search.slice(1);
    if (!params) {
      setStatus('error');
      setMessage('missing auth data');
      return;
    }
    fetch('/api/auth/telegram?' + params)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setUser(data.user);
          setStatus('ok');
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
      <p>Welcome, {user.first_name}</p>
    </main>
  );
}

