import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../socket';
import { RefreshCw, Copy, Check } from 'lucide-react';

interface Team {
  id: string;
  teamId: string;
  teamName: string;
  password?: string;
  region: string;
  food: number;
  material: number;
  gold: number;
}

export default function Leaderboard() {
  const { token } = useAdminAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setTeams(await res.json());
  }, [token]);

  useEffect(() => {
    fetchTeams();
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setOrders(await res.json());
      } catch (e) {}
    };
    fetchOrders();

    const handleLedgerUpdate = (data: any[]) => {
      setOrders(data);
    };

    const s = getSocket(token);
    s.on('admin_refresh', fetchTeams);
    s.on('team_hud_update', fetchTeams);
    s.on('ledger_update', handleLedgerUpdate);

    return () => {
      s.off('admin_refresh', fetchTeams);
      s.off('team_hud_update', fetchTeams);
      s.off('ledger_update', handleLedgerUpdate);
    };
  }, [token, fetchTeams]);

  const getAdminBuyRate = (resType: 'FOOD' | 'MATERIAL') => {
    const adminBuyOrder = orders.find(o => o.isAdminOrder && o.orderType === 'BUY' && o.resourceType === resType);
    return adminBuyOrder ? adminBuyOrder.price : 1;
  };

  const foodRate = getAdminBuyRate('FOOD');
  const materialRate = getAdminBuyRate('MATERIAL');

  const handleUpdate = async (id: string, field: string, val: string) => {
    if (!token) return;
    const team = teams.find(t => t.id === id);
    if (!team) return;
    
    await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...team, [field]: Number(val) })
    });
    fetchTeams();
  };

  const handleCopyPassword = (id: string, password?: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRerollPassword = async (id: string, teamName: string) => {
    if (!token) return;
    const newPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (!confirm(`Reroll password for ${teamName} to "${newPassword}"?`)) return;

    await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password: newPassword })
    });
    fetchTeams();
  };

  return (
    <div>
      <h1 className="text-3xl mb-6 font-serif font-bold text-gold-500">
        <span>Live Leaderboard</span>
      </h1>

      <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-900 border-b border-stone-700 text-gold-500">
            <tr>
              <th className="p-4 border-r border-stone-700">Team</th>
              <th className="p-4 border-r border-stone-700">Password</th>
              <th className="p-4 border-r border-stone-700">Region</th>
              <th className="p-4 border-r border-stone-700">Food</th>
              <th className="p-4 border-r border-stone-700">Material</th>
              <th className="p-4 border-r border-stone-700">Gold</th>
              <th className="p-4">NAV</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => {
              const nav = Math.round(t.gold + (t.food * foodRate) + (t.material * materialRate));
              return (
                <tr key={t.id} className="border-b border-stone-700 last:border-0 hover:bg-stone-800">
                  <td className="p-4 border-r border-stone-700">
                    <div className="font-bold text-parchment">{t.teamName}</div>
                    <div className="text-sm text-stone-400 font-mono">{t.teamId}</div>
                  </td>
                  <td className="p-4 border-r border-stone-700 font-mono text-gold-400 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span>{t.password || '---'}</span>
                      <div className="flex items-center gap-1">
                        {t.password && (
                          <button
                            onClick={() => handleCopyPassword(t.id, t.password)}
                            className="p-1 text-stone-500 hover:text-gold-400 hover:bg-stone-700/60 rounded transition"
                            title={copiedId === t.id ? "Copied!" : "Copy Password"}
                          >
                            {copiedId === t.id ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleRerollPassword(t.id, t.teamName)}
                          className="p-1 text-stone-500 hover:text-gold-400 hover:bg-stone-700/60 rounded transition"
                          title="Reroll Password"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-r border-stone-700 italic text-parchment">{t.region}</td>

                  <td className="p-4 border-r border-stone-700">
                    <input 
                      type="number" 
                      className="bg-transparent border-b border-stone-600 w-16 text-center focus:outline-none focus:border-gold-500 font-mono"
                      value={t.food}
                      onChange={(e) => handleUpdate(t.id, 'food', e.target.value)}
                    />
                  </td>
                  <td className="p-4 border-r border-stone-700">
                    <input 
                      type="number" 
                      className="bg-transparent border-b border-stone-600 w-16 text-center focus:outline-none focus:border-gold-500 font-mono"
                      value={t.material}
                      onChange={(e) => handleUpdate(t.id, 'material', e.target.value)}
                    />
                  </td>
                  <td className="p-4 border-r border-stone-700">
                    <input 
                      type="number" 
                      className="bg-transparent border-b border-stone-600 w-24 text-center focus:outline-none focus:border-gold-500 font-mono"
                      value={t.gold}
                      onChange={(e) => handleUpdate(t.id, 'gold', e.target.value)}
                    />
                  </td>
                  <td className="p-4 font-bold text-gold-400 text-xl font-mono">{nav.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
