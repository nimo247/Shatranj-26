import { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAdminAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: 'ADMIN', password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900">
      <form onSubmit={handleLogin} className="bg-stone-850 p-8 rounded-lg border border-gold-600 shadow-2xl w-96 text-center">
        <h1 className="text-3xl mb-6">The Imperial Citadel</h1>
        <input 
          type="password" 
          placeholder="Admin Keyword"
          className="w-full p-3 bg-stone-900 text-parchment border border-stone-700 rounded mb-4 focus:outline-none focus:border-gold-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-crimson-700 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full bg-gold-600 text-stone-900 font-bold py-3 rounded hover:bg-gold-500 transition-colors">
          Enter God Mode
        </button>
      </form>
    </div>
  );
}
