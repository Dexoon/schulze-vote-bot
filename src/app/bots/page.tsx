'use client';
import { useState, useEffect } from 'react';

interface Bot {
  token: string;
  webhook?: string;
  path?: string;
}

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bots');
      if (stored) setBots(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bots', JSON.stringify(bots));
    } catch {}
  }, [bots]);

  async function register() {
    if (!token) return;
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setBots([...bots, { token, webhook: data.webhook, path: data.path }]);
        setToken('');
        setStatus('Bot registered');
      } else {
        setStatus(data.error || 'Failed to register');
      }
    } catch {
      setStatus('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Your Bots</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Bot token"
        />
        <button onClick={register} disabled={loading || !token} style={{ marginLeft: '0.5rem' }}>
          Register
        </button>
        {status && <p>{status}</p>}
      </div>
      <ul>
        {bots.map((b, i) => (
          <li key={i} style={{ marginBottom: '1rem' }}>
            <div>Token: {b.token}</div>
            {b.webhook && <div>Webhook: {b.webhook}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
