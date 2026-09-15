import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getSocket } from '../../socket';
import { Check, X, Clock, RefreshCw, Edit3, Save, Trash2 } from 'lucide-react';

interface ActiveCard {
  id: number | string;
  name: string;
  upkeepFood: number;
  upkeepMaterial: number;
  upkeepGold: number;
  returnFood: number;
  returnMaterial: number;
  returnGold: number;
  isDisaster?: boolean;
}

interface TeamState {
  id: string;
  teamId: string;
  region: string;
  food: number;
  material: number;
  gold: number;
  activeCards: ActiveCard[];
  netFood: number;
  netMaterial: number;
  netGold: number;
  hasFoodUpkeep: boolean;
  hasMaterialUpkeep: boolean;
  canAfford: boolean;
}

interface Snapshot {
  id: number | string;
  roundNum: number;
  createdAt: string;
  data: string; // JSON string of TeamState[]
}

export default function RoundEnginePanel({ gameState }: { gameState?: string }) {
  const { token } = useAdminAuth();
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [activeDebuffs, setActiveDebuffs] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSettingRound, setIsSettingRound] = useState(false);
  const [newRoundVal, setNewRoundVal] = useState('');

  const fetchState = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/rounds/state', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);
        setCurrentRound(data.currentRound);
        setSnapshots(data.snapshots.reverse());
      }
      const resD = await fetch('/api/disasters/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resD.ok) {
        setActiveDebuffs(await resD.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const socket = getSocket(token);
    socket.on('admin_refresh', fetchState);
    socket.on('cards_updated', fetchState);
    socket.on('disaster_refresh', fetchState);

    return () => {
      socket.off('admin_refresh', fetchState);
      socket.off('cards_updated', fetchState);
      socket.off('disaster_refresh', fetchState);
    };
  }, [token]);

  const handleLogRound = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/rounds/log', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to log round');
      } else {
        await fetchState();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRound = async () => {
    if (!token || !newRoundVal) return;
    try {
      await fetch('/api/rounds/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roundNum: Number(newRoundVal) })
      });
      setIsSettingRound(false);
      setNewRoundVal('');
      await fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetRound = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to completely reset the rounds count to 0? This will wipe all previous round snapshots.")) return;
    try {
      await fetch('/api/rounds/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const formatCards = (cards: ActiveCard[]) => {
    if (cards.length === 0) return <span className="text-stone-500 italic">None</span>;
    return (
      <div className="flex flex-wrap gap-2 leading-relaxed">
        {cards.map((c, i) => {
          if (c.isDisaster) {
            return (
                <span key={c.id} className="text-red-400 font-bold bg-red-950/40 px-1 rounded">
                  [{c.name}: <span className="text-red-300">Food {c.returnFood - (c.upkeepFood || 0) > 0 ? '+' : ''}{c.returnFood - (c.upkeepFood || 0)}</span>,
                  <span className="text-red-300"> Mat {c.returnMaterial - (c.upkeepMaterial || 0) > 0 ? '+' : ''}{c.returnMaterial - (c.upkeepMaterial || 0)}</span>,
                  <span className="text-red-300"> Gold {c.returnGold - (c.upkeepGold || 0) > 0 ? '+' : ''}{c.returnGold - (c.upkeepGold || 0)}</span>]
                  {i < cards.length - 1 && '; '}
                </span>
              );
          }
          return (
            <span key={c.id}>
              {c.id}. {c.name} <span className="text-yellow-400">Food {c.returnFood - (c.upkeepFood || 0) > 0 ? '+' : ''}{c.returnFood - (c.upkeepFood || 0)}</span>,
              <span className="text-stone-300"> Mat {c.returnMaterial - (c.upkeepMaterial || 0) > 0 ? '+' : ''}{c.returnMaterial - (c.upkeepMaterial || 0)}</span>,
              <span className="text-amber-500"> Gold {c.returnGold - (c.upkeepGold || 0) > 0 ? '+' : ''}{c.returnGold - (c.upkeepGold || 0)}</span>
              {i < cards.length - 1 && '; '}
            </span>
          );
        })}
      </div>
    );
  };

  const handleRemoveDebuff = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to remove this active disaster debuff?')) return;
    try {
      const res = await fetch(`/api/disasters/debuffs/${id}/remove`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to remove debuff');
      } else {
        await fetchState();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const formatStats = (netFood: number, netMaterial: number, netGold: number) => {
    return (
      <div className="flex items-center gap-1">
        <span className="text-yellow-400 font-bold">Food {netFood > 0 ? '+' : ''}{netFood}</span>,
        <span className="text-stone-300 font-bold">Mat {netMaterial > 0 ? '+' : ''}{netMaterial}</span>,
        <span className="text-amber-500 font-bold">Gold {netGold > 0 ? '+' : ''}{netGold}</span>
      </div>
    );
  };

  const insufficientTeams = teams.filter(t => !t.canAfford);
  const canLog = insufficientTeams.length === 0 && teams.length > 0 && gameState === 'PAUSED';

  const renderTable = (teamList: TeamState[], isSnapshot = false) => (
    <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden shadow-xl mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-stone-900 border-b border-stone-700 text-gold-500">
            <tr>
              <th className="p-3 border-r border-stone-700 whitespace-nowrap">Team ID</th>
              <th className="p-3 border-r border-stone-700 whitespace-nowrap">Team Region</th>
              <th className="p-3 border-r border-stone-700 min-w-[350px]">Active Cards</th>
              <th className="p-3 border-r border-stone-700 text-center whitespace-nowrap">Have Upkeep</th>
              <th className="p-3 whitespace-nowrap">Logging Stats</th>
            </tr>
          </thead>
          <tbody>
            {teamList.map((t, idx) => (
              <tr key={idx} className="border-b border-stone-700/50 hover:bg-stone-800/50 transition-colors">
                <td className="p-3 border-r border-stone-700/50 font-mono font-bold text-parchment">{t.teamId}</td>
                <td className="p-3 border-r border-stone-700/50 text-stone-300">{t.region}</td>
                <td className="p-3 border-r border-stone-700/50">{formatCards(t.activeCards)}</td>
                <td className="p-3 border-r border-stone-700/50 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {t.hasFoodUpkeep ? <Check size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                    {t.hasMaterialUpkeep ? <Check size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                  </div>
                </td>
                <td className="p-3">
                  {formatStats(t.netFood, t.netMaterial, t.netGold)}
                </td>
              </tr>
            ))}
            {teamList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-stone-500 italic">No teams found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-2 max-w-7xl mx-auto space-y-12">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gold-500 flex items-center gap-3">
              <Clock size={32} />
              Round Engine
            </h1>
            <p className="text-stone-400 mt-2 max-w-2xl">
              Log game rounds here. This calculates all active cards sustain and produce across all teams instantly.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 bg-stone-850 p-4 rounded-lg border border-stone-700 shadow-xl">
              <div className="flex flex-col items-end border-r border-stone-700 pr-4">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Current</span>
                {isSettingRound ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      value={newRoundVal}
                      onChange={e => setNewRoundVal(e.target.value)}
                      className="w-16 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-gold-400 font-mono text-lg focus:outline-none focus:border-gold-500 text-center"
                    />
                    <button onClick={handleSetRound} className="p-1.5 bg-green-700 hover:bg-green-600 rounded text-white">
                      <Save size={16} />
                    </button>
                    <button onClick={() => setIsSettingRound(false)} className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-white">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-mono text-gold-400 font-bold leading-none">Rounds: {currentRound}</span>
                    <button onClick={() => { setIsSettingRound(true); setNewRoundVal(currentRound.toString()); }} className="text-stone-500 hover:text-gold-400 transition">
                      <Edit3 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 relative">
                <button 
                  onClick={handleLogRound}
                  disabled={!canLog || loading}
                  title={gameState !== 'PAUSED' ? 'Game must be PAUSED to log a round' : ''}
                  className={`px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition shadow-lg ${
                    canLog 
                      ? 'bg-gold-600 hover:bg-gold-500 text-stone-900'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Log Round
                </button>
                <button 
                  onClick={handleResetRound}
                  className="text-xs text-stone-500 hover:text-red-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1 transition"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              </div>
            </div>
            
            {!canLog && (
              <div className="text-red-400 font-bold text-sm bg-red-950/40 border border-red-900 px-3 py-1.5 rounded self-end w-full max-w-sm text-center">
                Insufficient funds: {insufficientTeams.map(t => t.teamId).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          {activeDebuffs.length > 0 && (
            <div className="mb-4 bg-red-950/20 border border-red-900 rounded-lg p-4">
              <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm mb-3">Active Disaster Effects Tracker</h3>
              <div className="space-y-2">
                {activeDebuffs.map((d: any) => {
                  const mods = [];
                    const fmt = (v: number) => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
                    if (d.foodSustain) mods.push(`Food Sustain: ${fmt(d.foodSustain)}`);
                    if (d.foodReturn) mods.push(`Food Return: ${fmt(d.foodReturn)}`);
                    if (d.materialSustain) mods.push(`Material Sustain: ${fmt(d.materialSustain)}`);
                    if (d.materialReturn) mods.push(`Material Return: ${fmt(d.materialReturn)}`);
                    if (d.goldSustain) mods.push(`Gold Sustain: ${fmt(d.goldSustain)}`);
                    if (d.goldReturn) mods.push(`Gold Return: ${fmt(d.goldReturn)}`);
                  const modStr = mods.length > 0 ? mods.join(' | ') : 'No Base Yield Modifiers';

                  return (
                    <div key={d.id} className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-stone-700/50">
                      <div className="flex items-center gap-2 text-stone-300 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                        <div>
                          <strong className="text-parchment">{d.disasterName}</strong> - {d.description} 
                          <span className="text-red-400 italic ml-1">
                            ({modStr}, Scope: {d.isRegional ? `Regional (${d.regions})` : 'Continental'})
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveDebuff(d.id)}
                        className="text-stone-500 hover:text-red-500 transition p-1 bg-stone-800 rounded hover:bg-red-950"
                        title="Remove Disaster Debuff"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {renderTable(teams)}
        </div>
      </div>

      {snapshots.length > 0 && (
        <div className="space-y-12">
          {snapshots.map(snap => {
            let parsed: TeamState[] = [];
            let events: string[] = [];
            try { 
              const raw = JSON.parse(snap.data);
              parsed = Array.isArray(raw) ? raw : (raw.teams || []);
              events = Array.isArray(raw) ? [] : (raw.events || []);
            } catch (e) {}
            return (
              <div key={snap.id} className="relative">
                <div className="mb-2 flex flex-col gap-1">
                  <span className="text-gold-400 font-serif font-bold text-xl uppercase tracking-widest">
                    Table {snap.roundNum}
                  </span>
                  {events.length > 0 && (
                    <div className="text-xs text-red-400 font-bold">
                      Active Debuffs at Log: {events.join(', ')}
                    </div>
                  )}
                </div>
                {renderTable(parsed, true)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
