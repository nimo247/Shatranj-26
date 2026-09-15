import { useState } from 'react';
import { useTeamAuth } from '../../contexts/TeamAuthContext';

export default function ParticipantLogin() {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useTeamAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password })
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
    <div className="min-h-screen flex items-center justify-center bg-stone-900 bg-opacity-90 relative overflow-hidden">
      <div className="absolute inset-0 border-[16px] border-stone-850 pointer-events-none"></div>
      <form onSubmit={handleLogin} className="bg-stone-850 p-10 rounded-lg border-2 border-gold-600 shadow-2xl w-[28rem] relative z-10">
        <h1 className="text-4xl mb-2 font-serif font-bold text-gold-500 text-center">Shatranj</h1>
        <p className="text-stone-400 text-center mb-8 italic">Enter The Realm</p>
        
        <input 
          type="text" 
          placeholder="Team ID (e.g. T1)"
          className="w-full p-4 text-lg bg-stone-900 text-parchment border border-stone-700 rounded mb-4 focus:outline-none focus:border-gold-500"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />
        
        <input 
          type="password" 
          placeholder="Password"
          className="w-full p-4 text-lg bg-stone-900 text-parchment border border-stone-700 rounded mb-6 focus:outline-none focus:border-gold-500"
          value={password}
          onChange={(e) => setPassword(e.target.value.toUpperCase())}
        />
        
        {error && <p className="text-crimson-700 font-bold mb-4 text-center">{error}</p>}
        
        <button type="submit" className="w-full bg-gold-600 text-stone-900 font-bold text-lg py-4 rounded hover:bg-gold-500 transition-colors">
          Take Your Seat
        </button>
      </form>
    </div>
  );
}
