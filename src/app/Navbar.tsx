'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export default function Navbar() {
  const [user, setUser] = useState<TgUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tgUser');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <nav className="navbar">
      <Link href="/" className="nav-link">Home</Link>
      <Link href="/bots" className="nav-link">Bots</Link>
      <div className="nav-user">
        {user ? (
          <>
            <span className="nav-user-name">Logged in as {user.first_name}</span>
            <Link href="/logout" className="nav-link">Logout</Link>
          </>
        ) : (
          <Link href="/login" className="nav-link">Login</Link>
        )}
      </div>
    </nav>
  );
}
