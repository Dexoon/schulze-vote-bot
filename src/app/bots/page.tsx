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
  const [editing, setEditing] = useState<string | null>(null);
  const [editToken, setEditToken] = useState('');

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

  async function callRegister(tok: string) {
    try {
      const res = await fetch('/api/bot/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tok }),
      });
      const data = await res.json();
      if (res.ok) {
        return { webhook: data.webhook as string, path: data.path as string };
      } else {
        return { error: data.error || 'Failed to register' };
      }
    } catch {
      return { error: 'Request failed' };
    }
  }

  async function register() {
    if (!token) return;
    if (bots.some(b => b.token === token)) {
      setStatus('Bot already added');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const { webhook, path, error } = await callRegister(token);
      if (webhook) {
        setBots([...bots, { token, webhook, path }]);
        setToken('');
        setStatus('Bot registered');
      } else if (error) {
        setStatus(error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(original: string) {
    if (!editToken) return;
    if (bots.some(b => b.token === editToken && b.token !== original)) {
      setStatus('Bot already added');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const { webhook, path, error } = await callRegister(editToken);
      if (webhook) {
        setBots(
          bots.map(b =>
            b.token === original ? { token: editToken, webhook, path } : b
          )
        );
        setEditing(null);
        setEditToken('');
        setStatus('Bot updated');
      } else if (error) {
        setStatus(error);
      }
    } finally {
      setLoading(false);
    }
  }

  function remove(token: string) {
    setBots(bots.filter(b => b.token !== token));
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
        {bots.map(b => (
          <li key={b.token} style={{ marginBottom: '1rem' }}>
            {editing === b.token ? (
              <>
                <input
                  type="text"
                  value={editToken}
                  onChange={e => setEditToken(e.target.value)}
                />
                <button
                  onClick={() => saveEdit(b.token)}
                  disabled={loading || !editToken}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setEditToken('');
                  }}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div>Token: {b.token}</div>
                {b.webhook && <div>Webhook: {b.webhook}</div>}
                <button
                  onClick={() => {
                    setEditing(b.token);
                    setEditToken(b.token);
                  }}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(b.token)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Delete
                </button>
              </>
              )}
          </li>
        ))}
      </ul>
    </main>
  );
}
