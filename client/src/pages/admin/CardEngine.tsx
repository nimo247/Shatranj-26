import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getSocket } from '../../socket';
import { ChevronDown, ChevronRight, Check, X, ShieldAlert, Wheat, Pickaxe, Coins } from 'lucide-react';

interface Card {
  id: number;
  name: string;
  description: string;
  type: string;
  isElite: boolean;
  buildCostFood: number;
  buildCostMaterial: number;
  buildCostGold: number;
  sustainCostFood: number;
  sustainCostMaterial: number;
  sustainCostGold: number;
  returnFood: number;
  returnMaterial: number;
  returnGold: number;
  nav: number;
  teamId: string | null;
  isBuilt: boolean;
  isActive: boolean;
  isDisabled: boolean;
  assignedAt: string | null;
}

interface Team {
  id: string;
  teamId: string;
}

export default function CardEnginePanel() {
  const { token } = useAdminAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/admin/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCards(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTeams(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchTeams();
    const socket = getSocket(token);
    socket.on('cards_updated', fetchCards);
    return () => {
      socket.off('cards_updated', fetchCards);
    };
  }, [token]);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedCards(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandedCards.size === cards.length) {
      setExpandedCards(new Set());
    } else {
      setExpandedCards(new Set(cards.map(c => c.id)));
    }
  };

  const assignCard = async (cardId: number, teamId: string) => {
    await fetch('/api/admin/cards/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cardId, teamId: teamId === 'UNASSIGNED' ? null : teamId })
    });
  };

  const toggleDisable = async (cardId: number) => {
    await fetch('/api/admin/cards/toggle-disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cardId })
    });
  };

  const toggleBuild = async (cardId: number) => {
    await fetch('/api/admin/cards/toggle-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cardId })
    });
  };

  const renderResourceIcons = (typeStr: string) => {
    const types = typeStr.split(',').map(t => t.trim().toUpperCase());
    return (
      <div className="flex space-x-1">
        {types.includes('FOOD') && <Wheat size={16} className="text-emerald-500" />}
        {types.includes('MATERIAL') && <Pickaxe size={16} className="text-amber-600" />}
        {types.includes('LUXURY') && <ShieldAlert size={16} className="text-purple-500" />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-gold-500 font-bold">Card Engine</h2>
          <p className="text-stone-400 text-sm">Manage all 170 domain cards.</p>
        </div>
        <button
          onClick={toggleExpandAll}
          className="bg-stone-800 border border-stone-700 text-parchment px-4 py-2 rounded hover:bg-stone-700 transition-colors text-sm font-bold"
        >
          {expandedCards.size === cards.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-900 border-b border-stone-700 text-stone-400">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">#</th>
              <th className="p-3">Type</th>
              <th className="p-3">Name</th>
              <th className="p-3">Assigned To</th>
              <th className="p-3 text-center">Built</th>
              <th className="p-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {cards.map(card => {
              const isExpanded = expandedCards.has(card.id);
              return (
                <React.Fragment key={card.id}>
                  <tr 
                    className={`hover:bg-stone-800 transition-colors ${card.isDisabled ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 cursor-pointer" onClick={() => toggleExpand(card.id)}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td className="p-3 font-mono font-bold text-stone-400 cursor-pointer" onClick={() => toggleExpand(card.id)}>{card.id}{card.isElite && <span className="text-purple-500 ml-1">★</span>}</td>
                    <td className="p-3 cursor-pointer" onClick={() => toggleExpand(card.id)}>{renderResourceIcons(card.type)}</td>
                    <td className="p-3 font-bold text-parchment cursor-pointer" onClick={() => toggleExpand(card.id)}>{card.name}</td>
                    <td className="p-3">
                      <select
                        value={card.teamId || 'UNASSIGNED'}
                        onChange={(e) => assignCard(card.id, e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-parchment w-full max-w-[120px]"
                      >
                        <option value="UNASSIGNED">Unassigned</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.teamId}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      {card.isBuilt ? (
                        <span className="inline-flex items-center text-emerald-500"><Check size={14} className="mr-1"/> Built</span>
                      ) : (
                        <span className="text-stone-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {card.isActive ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-700">Active</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-500 border border-stone-700">Inactive</span>
                      )}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-stone-900/50">
                      <td colSpan={7} className="p-4 border-l-4 border-gold-600">
                        <div className="flex flex-col space-y-4">
                          <p className="text-stone-300 italic text-sm">{card.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <table className="w-full text-xs text-center border border-stone-700">
                                <thead>
                                  <tr className="bg-stone-800">
                                    <th className="p-1 border border-stone-700"></th>
                                    <th className="p-1 border border-stone-700 text-emerald-500"><Wheat size={12} className="inline mr-1"/> Food</th>
                                    <th className="p-1 border border-stone-700 text-amber-500"><Pickaxe size={12} className="inline mr-1"/> Mat</th>
                                    <th className="p-1 border border-stone-700 text-gold-400"><Coins size={12} className="inline mr-1"/> Gold</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="p-1 border border-stone-700 font-bold text-left bg-stone-850">Build</td>
                                    <td className="p-1 border border-stone-700">{card.buildCostFood || '-'}</td>
                                    <td className="p-1 border border-stone-700">{card.buildCostMaterial || '-'}</td>
                                    <td className="p-1 border border-stone-700">{card.buildCostGold || '-'}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1 border border-stone-700 font-bold text-left bg-stone-850">Sustain</td>
                                    <td className="p-1 border border-stone-700">{card.sustainCostFood || '-'}</td>
                                    <td className="p-1 border border-stone-700">{card.sustainCostMaterial || '-'}</td>
                                    <td className="p-1 border border-stone-700">{card.sustainCostGold || '-'}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-1 border border-stone-700 font-bold text-left bg-stone-850">Return</td>
                                    <td className="p-1 border border-stone-700 text-emerald-400">{card.returnFood || '-'}</td>
                                    <td className="p-1 border border-stone-700 text-emerald-400">{card.returnMaterial || '-'}</td>
                                    <td className="p-1 border border-stone-700 text-emerald-400">{card.returnGold || '-'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="flex flex-col space-y-2 justify-center">
                              <div className="text-sm">
                                <span className="text-stone-400">Net Asset Value:</span> <span className="text-gold-400 font-bold">{card.nav}G</span>
                              </div>
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={() => toggleDisable(card.id)}
                                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                    card.isDisabled 
                                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700 hover:bg-emerald-900' 
                                      : 'bg-red-900/50 text-red-400 border border-red-700 hover:bg-red-900'
                                  }`}
                                >
                                  {card.isDisabled ? 'Force Activate' : 'Force Deactivate'}
                                </button>
                                <button
                                  onClick={() => toggleBuild(card.id)}
                                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                    card.isBuilt 
                                      ? 'bg-stone-800 text-stone-300 border border-stone-600 hover:bg-stone-700' 
                                      : 'bg-gold-900/50 text-gold-400 border border-gold-700 hover:bg-gold-900'
                                  }`}
                                >
                                  {card.isBuilt ? 'Force Unbuild' : 'Force Build'}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
