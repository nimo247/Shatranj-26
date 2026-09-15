import React, { useState, useEffect } from 'react';
import { useTeamAuth } from '../../contexts/TeamAuthContext';
import { getSocket } from '../../socket';
import { ChevronDown, ChevronRight, Wheat, Pickaxe, Coins, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';

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
  isBuilt: boolean;
  isActive: boolean;
  isDisabled: boolean;
  assignedAt: string | null;
}

export default function CardsPanel({ teamState, gameState }: { teamState: any, gameState?: string }) {
  const { token } = useTeamAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/team/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCards(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCards();
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

  const buildCard = async (card: Card) => {
    if (!confirm(`Are you sure you want to build ${card.name}? This will cost ${card.buildCostFood} Food, ${card.buildCostMaterial} Material, and ${card.buildCostGold} Gold.`)) return;
    try {
      const res = await fetch('/api/team/cards/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cardId: card.id })
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to build card");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (cardId: number) => {
    try {
      const res = await fetch('/api/team/cards/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cardId })
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to toggle card");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderResourceIcons = (typeStr: string) => {
    const types = typeStr.split(',').map(t => t.trim().toUpperCase());
    return (
      <div className="flex space-x-1 items-center">
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
          <h2 className="text-2xl font-serif text-gold-500 font-bold">Your Cards</h2>
          <p className="text-stone-400 text-sm">Cards assigned to your team by the Admin.</p>
        </div>
        <button
          onClick={toggleExpandAll}
          className="bg-stone-800 border border-stone-700 text-parchment px-4 py-2 rounded hover:bg-stone-700 transition-colors text-sm font-bold"
        >
          {expandedCards.size === cards.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="bg-stone-900 border border-stone-700 rounded-lg p-3 flex items-center shadow-lg overflow-x-auto">
        <span className="text-stone-400 uppercase tracking-widest text-xs font-bold mr-4 whitespace-nowrap">Next Round</span>
        <div className="flex space-x-2">
          <div className="bg-stone-850 border border-stone-700 px-3 py-1 rounded flex items-center space-x-2">
            <Wheat size={16} className="text-emerald-500" />
            <span className={`font-mono font-bold ${(teamState?.netFood || 0) > 0 ? 'text-emerald-400' : (teamState?.netFood || 0) < 0 ? 'text-red-400' : 'text-stone-400'}`}>
              {(teamState?.netFood || 0) > 0 ? '+' : ''}{teamState?.netFood || 0}
            </span>
          </div>
          <div className="bg-stone-850 border border-stone-700 px-3 py-1 rounded flex items-center space-x-2">
            <Pickaxe size={16} className="text-amber-600" />
            <span className={`font-mono font-bold ${(teamState?.netMaterial || 0) > 0 ? 'text-emerald-400' : (teamState?.netMaterial || 0) < 0 ? 'text-red-400' : 'text-stone-400'}`}>
              {(teamState?.netMaterial || 0) > 0 ? '+' : ''}{teamState?.netMaterial || 0}
            </span>
          </div>
          <div className="bg-stone-850 border border-stone-700 px-3 py-1 rounded flex items-center space-x-2">
            <Coins size={16} className="text-gold-500" />
            <span className={`font-mono font-bold ${(teamState?.netGold || 0) > 0 ? 'text-emerald-400' : (teamState?.netGold || 0) < 0 ? 'text-red-400' : 'text-stone-400'}`}>
              {(teamState?.netGold || 0) > 0 ? '+' : ''}{teamState?.netGold || 0}
            </span>
          </div>
        </div>
      </div>

        {(() => {
          if (!teamState?.appliedDebuffs?.length) return null;
          
          const buffs: any[] = [];
          teamState.appliedDebuffs.forEach((d: any) => {
            if (d.foodReturn) buffs.push({ key: 'Food Production', val: d.foodReturn, type: 'return', disaster: d.disasterName, cardTarget: d.cardTarget });
            if (d.foodSustain) buffs.push({ key: 'Food Sustain', val: d.foodSustain, type: 'sustain', disaster: d.disasterName, cardTarget: d.cardTarget });
            if (d.materialReturn) buffs.push({ key: 'Material Production', val: d.materialReturn, type: 'return', disaster: d.disasterName, cardTarget: d.cardTarget });
            if (d.materialSustain) buffs.push({ key: 'Material Sustain', val: d.materialSustain, type: 'sustain', disaster: d.disasterName, cardTarget: d.cardTarget });
            if (d.goldReturn) buffs.push({ key: 'Gold Production', val: d.goldReturn, type: 'return', disaster: d.disasterName, cardTarget: d.cardTarget });
            if (d.goldSustain) buffs.push({ key: 'Gold Sustain', val: d.goldSustain, type: 'sustain', disaster: d.disasterName, cardTarget: d.cardTarget });
          });

          if (buffs.length === 0) return null;

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {buffs.map((b, i) => {
                const isBad = (b.type === 'sustain' && b.val > 0) || (b.type === 'return' && b.val < 0);
                const isUp = b.val > 0;
                const sign = b.val > 0 ? '+' : '';
                const pct = Math.round(b.val * 100);
                
                const containerClass = isBad 
                  ? "bg-red-950/20 border border-red-900 rounded p-3 flex items-center gap-3 relative overflow-hidden shadow-lg" 
                  : "bg-emerald-950/20 border border-emerald-900 rounded p-3 flex items-center gap-3 relative overflow-hidden shadow-lg";
                const barClass = isBad ? "absolute top-0 left-0 w-1 h-full bg-red-600" : "absolute top-0 left-0 w-1 h-full bg-emerald-600";
                const iconClass = isBad ? "text-red-500" : "text-emerald-500";
                const textClass = isBad ? "font-bold text-sm tracking-wide text-red-200 uppercase" : "font-bold text-sm tracking-wide text-emerald-200 uppercase";

                return (
                  <div key={i} className={containerClass}>
                    <div className={barClass}></div>
                    {isUp ? <TrendingUp className={iconClass} size={24} /> : <TrendingDown className={iconClass} size={24} />}
                    <div className="flex-1">
                      <p className={textClass}>
                        {b.key} {sign}{pct}%
                        <span className="ml-1 opacity-75 text-[10px] normal-case tracking-normal block sm:inline">({b.disaster})</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden">
        {cards.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No cards assigned yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-900 border-b border-stone-700 text-stone-400">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3">#</th>
                <th className="p-3">Type</th>
                <th className="p-3">Name</th>
                <th className="p-3 text-center">Built</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-right">Acquired At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {cards.map(card => {
                const isExpanded = expandedCards.has(card.id);
                return (
                  <React.Fragment key={card.id}>
                    <tr className={`hover:bg-stone-800 transition-colors ${card.isDisabled ? 'opacity-50 grayscale' : ''}`}>
                      <td className="p-3 cursor-pointer" onClick={() => toggleExpand(card.id)}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-400 cursor-pointer" onClick={() => toggleExpand(card.id)}>
                        {card.id}{card.isElite && <span className="text-purple-500 ml-1">★</span>}
                      </td>
                      <td className="p-3 cursor-pointer" onClick={() => toggleExpand(card.id)}>{renderResourceIcons(card.type)}</td>
                      <td className="p-3 font-bold text-parchment cursor-pointer" onClick={() => toggleExpand(card.id)}>{card.name}</td>
                      <td className="p-3 text-center">
                        {card.isBuilt ? (
                          <span className="inline-block px-3 py-1 bg-emerald-900/50 text-emerald-400 border border-emerald-700 rounded text-xs font-bold">Built</span>
                        ) : (
                          <button
                            onClick={() => buildCard(card)}
                            disabled={card.isDisabled || gameState === 'PAUSED' }
                              title={gameState === 'PAUSED' ? 'Cannot build cards while game is paused' : ''}
                            className="px-3 py-1 bg-gold-600 text-stone-900 font-bold rounded text-xs hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Build
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleActive(card.id)}
                          disabled={card.isDisabled || gameState === 'PAUSED' || !card.isBuilt}
                          title={gameState === 'PAUSED' ? 'Cannot change active cards while game is paused' : (!card.isBuilt ? 'Card must be built first' : '')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            card.isActive 
                              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700 hover:bg-emerald-900' 
                              : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                          }`}
                        >
                          {card.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-3 text-right text-stone-500 font-mono text-xs">
                        {card.assignedAt ? new Date(card.assignedAt).toLocaleTimeString() : '-'}
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
                              
                              <div className="flex flex-col space-y-2 justify-center pl-4 border-l border-stone-700">
                                <div className="text-sm">
                                  <span className="text-stone-400">Net Asset Value:</span> <br/>
                                  <span className="text-gold-400 font-bold text-xl">{card.nav}G</span>
                                </div>
                                {card.isDisabled && (
                                  <div className="text-red-400 text-xs font-bold bg-red-900/30 p-2 rounded inline-block mt-2">
                                    Admin has disabled this card.
                                  </div>
                                )}
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
        )}
      </div>
    </div>
  );
}
