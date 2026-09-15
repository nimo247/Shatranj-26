import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getSocket } from '../../socket';
import { Activity, Clock, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

interface Disaster {
  name: string;
  scope: string; // CONTINENTAL or REGIONAL
  description: string;
  effect: string;
  regionsHit: string;
  defaultMaxCap?: number;
  flatFood?: number;
  flatMaterial?: number;
  flatGold?: number;
  flatLossTarget?: 'ACTIVE' | 'BUILT';
  grid?: {
    base?: { f: number; m: number; g: number };
    foodCard?: { f: number; m: number; g: number };
    materialCard?: { f: number; m: number; g: number };
    luxuryCard?: { f: number; m: number; g: number };
  };
  isCustom?: boolean;
  modifiers?: {
    foodSustain?: number;
    foodReturn?: number;
    materialSustain?: number;
    materialReturn?: number;
    goldSustain?: number;
    goldReturn?: number;
  };
}

interface DisasterLog {
  id: number;
  timestamp: string;
  roundNum: number;
  disasterName: string;
  description: string;
  impactedTeams: string;
  isRegional: boolean;
  regions: string;
  createdAt: string;
}

interface TeamState {
  id: string;
  teamId: string;
  region: string;
  food: number;
  material: number;
  gold: number;
  netFood: number;
  netMaterial: number;
  netGold: number;
  activeCardsCount: number;
  builtCardsCount: number;
  activeFoodCardsCount?: number;
  activeMaterialCardsCount?: number;
  activeLuxuryCardsCount?: number;
  builtFoodCardsCount?: number;
  builtMaterialCardsCount?: number;
  builtLuxuryCardsCount?: number;
}

export default function DisastersPanel() {
  const { token } = useAdminAuth();
  const socket = getSocket(token);

  const [gameState, setGameState] = useState<string>('NOT_STARTED');
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [logs, setLogs] = useState<DisasterLog[]>([]);
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const getAdminBuyRate = (type: string) => {
    const adminBuyOrder = orders.find(o => o.isAdminOrder && o.orderType === 'BUY' && o.resourceType === type);
    return adminBuyOrder ? adminBuyOrder.price : 1;
  };
  const foodRate = getAdminBuyRate('FOOD');
  const materialRate = getAdminBuyRate('MATERIAL');


  // Editable Fields
  const [maxCap, setMaxCap] = useState<number>(0.5); // Default max percent limit (50%)
  
  const [flatLossTarget, setFlatLossTarget] = useState<'ACTIVE' | 'BUILT'>('ACTIVE');

  type MatrixRow = { food: number, material: number, gold: number };
  const [lossMatrix, setLossMatrix] = useState<{
    base: MatrixRow;
    foodCard: MatrixRow;
    materialCard: MatrixRow;
    luxuryCard: MatrixRow;
  }>({
    base: { food: 0, material: 0, gold: 0 },
    foodCard: { food: 0, material: 0, gold: 0 },
    materialCard: { food: 0, material: 0, gold: 0 },
    luxuryCard: { food: 0, material: 0, gold: 0 }
  });
  
  // Modifiers
  const [foodSustain, setFoodSustain] = useState<number>(0);
  const [foodReturn, setFoodReturn] = useState<number>(0);
  const [materialSustain, setMaterialSustain] = useState<number>(0);
  const [materialReturn, setMaterialReturn] = useState<number>(0);
  const [goldSustain, setGoldSustain] = useState<number>(0);
  const [goldReturn, setGoldReturn] = useState<number>(0);

  useEffect(() => {
    if (selectedDisaster) {
        setMaxCap(selectedDisaster.defaultMaxCap ?? 0.5);
        setFlatLossTarget(selectedDisaster.flatLossTarget || 'ACTIVE');

        setLossMatrix({
          base: {
            food: selectedDisaster.flatFood ?? 0,
            material: selectedDisaster.flatMaterial ?? 0,
            gold: selectedDisaster.flatGold ?? 0
          },
          foodCard: {
            food: (selectedDisaster.grid?.foodCard?.f ?? 0) + (selectedDisaster.grid?.base?.f ?? 0),
            material: (selectedDisaster.grid?.foodCard?.m ?? 0) + (selectedDisaster.grid?.base?.m ?? 0),
            gold: (selectedDisaster.grid?.foodCard?.g ?? 0) + (selectedDisaster.grid?.base?.g ?? 0)
          },
          materialCard: {
            food: (selectedDisaster.grid?.materialCard?.f ?? 0) + (selectedDisaster.grid?.base?.f ?? 0),
            material: (selectedDisaster.grid?.materialCard?.m ?? 0) + (selectedDisaster.grid?.base?.m ?? 0),
            gold: (selectedDisaster.grid?.materialCard?.g ?? 0) + (selectedDisaster.grid?.base?.g ?? 0)
          },
          luxuryCard: {
            food: (selectedDisaster.grid?.luxuryCard?.f ?? 0) + (selectedDisaster.grid?.base?.f ?? 0),
            material: (selectedDisaster.grid?.luxuryCard?.m ?? 0) + (selectedDisaster.grid?.base?.m ?? 0),
            gold: (selectedDisaster.grid?.luxuryCard?.g ?? 0) + (selectedDisaster.grid?.base?.g ?? 0)
          }
        });

        setFoodSustain(selectedDisaster.modifiers?.foodSustain ?? 0);
        setFoodReturn(selectedDisaster.modifiers?.foodReturn ?? 0);
        setMaterialSustain(selectedDisaster.modifiers?.materialSustain ?? 0);
        setMaterialReturn(selectedDisaster.modifiers?.materialReturn ?? 0);
        setGoldSustain(selectedDisaster.modifiers?.goldSustain ?? 0);
        setGoldReturn(selectedDisaster.modifiers?.goldReturn ?? 0);
    }
  }, [selectedDisaster]);


  const fetchState = async () => {
    if (!token) return;
    try {
      const [gs, dis, logRes, teamsRes, roundRes, ordersRes] = await Promise.all([
        fetch('/api/game/state', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/disasters', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/disasters/logs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/teams', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/rounds/state', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
      ]);
      setGameState(gs.state || gs.gameState || 'NOT_STARTED');
      setDisasters(dis || []);
      setLogs(logRes || []);
      setTeams(roundRes.teams || teamsRes || []);
      setCurrentRound(roundRes?.currentRound || 0);
      if (Array.isArray(ordersRes)) setOrders(ordersRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchState();
    
    const handleGameStateUpdate = (state: string) => {
      setGameState(state);
    };

    const handleLedgerUpdate = (data: any[]) => {
      if (Array.isArray(data)) {
        setOrders(data);
      }
    };

    socket.on('admin_refresh', fetchState);
    socket.on('disaster_refresh', fetchState);
    socket.on('team_hud_update', fetchState);
    socket.on('game_state_update', handleGameStateUpdate);
    socket.on('ledger_update', handleLedgerUpdate);

    return () => {
      socket.off('admin_refresh', fetchState);
      socket.off('disaster_refresh', fetchState);
      socket.off('team_hud_update', fetchState);
      socket.off('game_state_update', handleGameStateUpdate);
      socket.off('ledger_update', handleLedgerUpdate);
    };
  }, [token]);

  
  const handleSaveCustom = async () => {
    if (!selectedDisaster || !token) return;
    try {
      const payload = {
        ...selectedDisaster,
        flatFood: lossMatrix.base.food,
        flatMaterial: lossMatrix.base.material,
        flatGold: lossMatrix.base.gold,
        flatLossTarget,
        defaultMaxCap: maxCap,
        grid: {
          base: { f: 0, m: 0, g: 0 },
          foodCard: { f: lossMatrix.foodCard.food, m: lossMatrix.foodCard.material, g: lossMatrix.foodCard.gold },
          materialCard: { f: lossMatrix.materialCard.food, m: lossMatrix.materialCard.material, g: lossMatrix.materialCard.gold },
          luxuryCard: { f: lossMatrix.luxuryCard.food, m: lossMatrix.luxuryCard.material, g: lossMatrix.luxuryCard.gold }
        },
        modifiers: {
          foodSustain, foodReturn, materialSustain, materialReturn, goldSustain, goldReturn
        }
      };
      const res = await fetch('/api/disasters/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Custom disaster saved!");
        fetchState();
      } else {
        const err = await res.json();
        alert("Failed to save: " + err.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCustom = async () => {
    if (!selectedDisaster || !token) return;
    if (!confirm(`Are you sure you want to delete ${selectedDisaster.name}? This removes active modifiers from this disaster.`)) return;
    try {
      const res = await fetch(`/api/disasters/custom/${encodeURIComponent(selectedDisaster.name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Deleted!");
        setSelectedDisaster(null);
        setIsEditingCustom(false);
        fetchState();
      }
    } catch (e) {}
  };

  const handleLaunch = async () => {
    if (gameState !== 'PAUSED') {
      alert("You can only launch disasters when the game is PAUSED.");
      return;
    }
    if (!selectedDisaster || !token) return;

    if (!confirm(`Are you sure you want to launch ${selectedDisaster.name}?`)) return;

    try {
      const isRegional = selectedDisaster.scope === 'REGIONAL';
      const regions = isRegional ? (selectedDisaster.regionsHit || '').split(',').map(r => r.trim()) : [];

      // Flat losses per team (e.g. per active card or just flat base loss)
      const flatLosses = teams.map(t => {
        const { f, m, g } = calculateTeamFlatLosses(t);

          let applies = !isRegional;
          if (isRegional) {
            const normalized = regions.map(r => r.toLowerCase().replace(/^the\s+/, ''));
            if (normalized.includes((t.region || '').toLowerCase().replace(/^the\s+/, '')) || normalized.includes(t.teamId.toLowerCase())) {
              applies = true;
            }
          }
          if (!applies) {
           return { teamId: t.id, food: 0, material: 0, gold: 0 };
        }

        return { teamId: t.id, food: f, material: m, gold: g };
      }).filter(l => l.food > 0 || l.material > 0 || l.gold > 0);

      const res = await fetch('/api/disasters/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          disasterName: selectedDisaster.name,
          description: selectedDisaster.description,
          isRegional,
          regions,
          flatLosses,
            flatLossTarget,
          modifiers: {
            foodSustain, foodReturn,
            materialSustain, materialReturn,
            goldSustain, goldReturn
          },
          maxCap,
          roundNum: currentRound
        })
      });

      if (!res.ok) throw new Error(await res.text());
      
      setSelectedDisaster(null);
      setLossMatrix({
        base: { food: 0, material: 0, gold: 0 },
        foodCard: { food: 0, material: 0, gold: 0 },
        materialCard: { food: 0, material: 0, gold: 0 },
        luxuryCard: { food: 0, material: 0, gold: 0 }
      });
      setFoodSustain(0);
      setFoodReturn(0);
      setMaterialSustain(0);
      setMaterialReturn(0);
      setGoldSustain(0);
      setGoldReturn(0);

    } catch (e: any) {
      alert(e.message);
    }
  };

  const calculateTeamFlatLosses = (t: TeamState) => {
    const fCount = flatLossTarget === 'ACTIVE' ? (t.activeFoodCardsCount || 0) : (t.builtFoodCardsCount || 0);
    const mCount = flatLossTarget === 'ACTIVE' ? (t.activeMaterialCardsCount || 0) : (t.builtMaterialCardsCount || 0);
    const lCount = flatLossTarget === 'ACTIVE' ? (t.activeLuxuryCardsCount || 0) : (t.builtLuxuryCardsCount || 0);

    const f = lossMatrix.base.food 
          + fCount * lossMatrix.foodCard.food 
          + mCount * lossMatrix.materialCard.food 
          + lCount * lossMatrix.luxuryCard.food;
    const m = lossMatrix.base.material
          + fCount * lossMatrix.foodCard.material
          + mCount * lossMatrix.materialCard.material
          + lCount * lossMatrix.luxuryCard.material;
    const g = lossMatrix.base.gold
          + fCount * lossMatrix.foodCard.gold
          + mCount * lossMatrix.materialCard.gold
          + lCount * lossMatrix.luxuryCard.gold;
    
    return { f, m, g };
  };

  const getPreviewLoss = (team: TeamState, type: 'food'|'material'|'gold') => {
    if (!selectedDisaster) return 0;
    const isRegional = selectedDisaster.scope === 'REGIONAL';
    const regions = isRegional ? (selectedDisaster.regionsHit || '').split(',').map(r => r.trim()) : [];

      if (isRegional) {
        const normalized = regions.map(r => r.toLowerCase().replace(/^the\s+/, ''));
        if (!normalized.includes((team.region || '').toLowerCase().replace(/^the\s+/, '')) && !normalized.includes(team.teamId.toLowerCase())) {
          return 0;
        }
      }

    const { f, m, g } = calculateTeamFlatLosses(team);

    let loss = 0;
    let currentBal = 0;
    if (type === 'food') { loss = f; currentBal = team.food; }
    if (type === 'material') { loss = m; currentBal = team.material; }
    if (type === 'gold') { loss = g; currentBal = team.gold; }

    if (loss <= 0) return 0;

    const maxLoss = Math.floor(currentBal * maxCap);
    return Math.min(loss, maxLoss);
  };

  const getSubtext = (team: TeamState, type: 'food'|'material'|'gold') => {
    const actualLoss = getPreviewLoss(team, type);
    if (actualLoss <= 0) return null;
    return <div className="text-red-400 text-[11px] font-bold mt-0.5">-{actualLoss}</div>;
  };

  const getNavPreview = (team: TeamState) => {
    const fLoss = getPreviewLoss(team, 'food');
    const mLoss = getPreviewLoss(team, 'material');
    const gLoss = getPreviewLoss(team, 'gold');
    const navLoss = gLoss + (fLoss * foodRate) + (mLoss * materialRate);
    if (navLoss <= 0) return null;
    return <div className="text-red-400 text-[11px] font-bold mt-0.5">-{navLoss} NAV</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-stone-700 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gold-400">Disaster Engine</h1>
          <p className="text-stone-400 text-sm mt-1">Global catastrophes and regional events.</p>
        </div>
        <button
          onClick={handleLaunch}
          disabled={gameState !== 'PAUSED' || !selectedDisaster}
          className={`px-8 py-3 rounded text-lg font-bold shadow-lg transition-colors flex items-center space-x-2 ${
            gameState === 'PAUSED' && selectedDisaster
              ? 'bg-red-900/80 text-red-100 hover:bg-red-800 border border-red-500'
              : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
          }`}
        >
          <ShieldAlert size={20} />
          <span>Launch Disaster</span>
        </button>
      </div>

      {gameState !== 'PAUSED' && (
        <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded flex items-center space-x-3 text-amber-200/80">
          <AlertTriangle size={20} />
          <span>Disasters can only be launched when the game ledger is PAUSED. Control this from the Dashboard.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 h-[400px]">
        {/* Left Panel: Disaster List */}
        <div className="bg-stone-850 rounded border border-stone-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-stone-700 bg-stone-900/50 font-serif font-bold text-parchment flex justify-between items-center">
            <span>Disaster Database</span>
            <button 
              onClick={() => {
                setIsEditingCustom(true);
                setSelectedDisaster({
                  name: "",
                  scope: "CONTINENTAL",
                  description: "",
                  effect: "",
                  regionsHit: "",
                  isCustom: true
                });
              }}
              className="px-2 py-1 bg-gold-500 text-stone-900 text-xs uppercase font-bold rounded hover:bg-gold-400 transition tracking-wider shadow"
            >
              + New Custom
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {[...disasters].sort((a,b) => (a.isCustom === b.isCustom ? 0 : a.isCustom ? -1 : 1)).map((d, i) => (
              <button
                key={i}
                onClick={() => { setSelectedDisaster(d); setIsEditingCustom(d.isCustom || false); }}
                className={`w-full text-left p-3 rounded transition-colors ${
                  selectedDisaster?.name === d.name
                    ? 'bg-stone-700 border border-gold-500/30'
                    : 'hover:bg-stone-800 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    d.scope === 'CONTINENTAL' ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50' : 'bg-cyan-900/50 text-cyan-400 border border-cyan-700/50'
                  }`}>
                    {d.scope}
                  </span>
                  <span className="font-bold text-parchment">{d.name}</span>
                  {d.isCustom && <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded font-bold" title="Custom Disaster">C</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        


        {/* Right Panel: Selected Config */}
        <div className="bg-stone-850 rounded border border-stone-700 flex flex-col overflow-y-auto p-6">
          {selectedDisaster ? (
            <div className="flex flex-col">
              <div className="mb-4 pb-4 border-b border-stone-700">
                
                  {isEditingCustom ? (
                    <div className="flex flex-col gap-2">
                      <input type="text" value={selectedDisaster.name} onChange={e => setSelectedDisaster({...selectedDisaster, name: e.target.value})} className="bg-stone-900 border border-stone-700 p-2 text-gold-400 font-bold" placeholder="Disaster Name" />
                      <textarea value={selectedDisaster.description} onChange={e => setSelectedDisaster({...selectedDisaster, description: e.target.value})} className="bg-stone-900 border border-stone-700 p-2 text-sm text-stone-300 italic" placeholder="Lore / Description"></textarea>
                      <input type="text" value={selectedDisaster.effect} onChange={e => setSelectedDisaster({...selectedDisaster, effect: e.target.value})} className="bg-stone-900 border border-stone-700 p-2 text-sm text-stone-300" placeholder="Lore Effect (Tagline)" />
                      <select value={selectedDisaster.scope} onChange={e => setSelectedDisaster({...selectedDisaster, scope: e.target.value})} className="bg-stone-900 border border-stone-700 p-2 text-sm text-stone-300">
                        <option value="CONTINENTAL">CONTINENTAL</option>
                        <option value="REGIONAL">REGIONAL</option>
                      </select>
                      {selectedDisaster.scope === 'REGIONAL' && (
                        <input type="text" value={selectedDisaster.regionsHit || ''} onChange={e => setSelectedDisaster({...selectedDisaster, regionsHit: e.target.value})} className="bg-stone-900 border border-stone-700 p-2 text-sm text-stone-300" placeholder={selectedDisaster.isCustom ? "Target Team IDs (e.g., T1, T2)" : "Regions Hit (comma separated)"} />
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveCustom} className="px-4 py-2 bg-green-800 text-green-200 rounded font-bold hover:bg-green-700">Save Custom</button>
                        {selectedDisaster.isCustom && <button onClick={handleDeleteCustom} className="px-4 py-2 bg-red-900 text-red-200 rounded font-bold hover:bg-red-800">Delete Custom</button>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gold-400 mb-2">{selectedDisaster.name}</h3>
                <p className="text-sm text-stone-300 italic mb-2">{selectedDisaster.description}</p>
                <p className="text-sm text-stone-400 mb-2"><strong className="text-stone-300">Lore Effect:</strong> {selectedDisaster.effect}</p>
                {selectedDisaster.scope === 'REGIONAL' && (
                  <p className="text-sm text-cyan-400"><strong className="text-stone-300">Regions Hit:</strong> {selectedDisaster.regionsHit}</p>
                )}
              
                    </>
                  )}
</div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 mb-1">Max Cap (0 to 1)</label>
                    <input type="number" step="0.05" min="0" max="1" value={maxCap} onChange={e => setMaxCap(parseFloat(e.target.value))} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    <span className="text-[10px] text-stone-500 mt-1 block">Locks max penalty to this % of total inventory.</span>
                  </div>
                </div>

                <div className="border-t border-stone-700 pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gold-500 mb-1">Resource Losses (Flat)</h4>
                      <p className="text-xs text-stone-400">Positive values deduct resources. Elite cards are not counted.</p>
                    </div>
                    <div className="flex bg-stone-900 border border-stone-700 rounded p-1">
                      <button 
                        className={`px-3 py-1 text-xs font-bold rounded ${flatLossTarget === 'ACTIVE' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-300'}`}
                        onClick={() => setFlatLossTarget('ACTIVE')}
                      >
                        Target Active Cards
                      </button>
                      <button 
                        className={`px-3 py-1 text-xs font-bold rounded ${flatLossTarget === 'BUILT' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-300'}`}
                        onClick={() => setFlatLossTarget('BUILT')}
                      >
                        Target Built Cards
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-stone-900 text-stone-400 text-xs">
                        <tr>
                          <th className="px-2 py-1">Rule</th>
                          <th className="px-2 py-1">Food</th>
                          <th className="px-2 py-1">Material</th>
                          <th className="px-2 py-1">Gold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-700">
                        {([
                          ['base', 'Base Loss (No Cards Needed)'],
                          ['foodCard', flatLossTarget === 'ACTIVE' ? 'Per Active Food Card' : 'Per Built Food Card'],
                          ['materialCard', flatLossTarget === 'ACTIVE' ? 'Per Active Material Card' : 'Per Built Material Card'],
                          ['luxuryCard', flatLossTarget === 'ACTIVE' ? 'Per Active Luxury Card' : 'Per Built Luxury Card']
                        ] as const).map(([key, label]) => (
                          <tr key={key} className="hover:bg-stone-800/50">
                            <td className="px-2 py-1 text-stone-300 text-xs font-bold">{label}</td>
                            <td className="px-2 py-1"><input type="number" value={lossMatrix[key].food} onChange={e => setLossMatrix(prev => ({...prev, [key]: {...prev[key], food: parseInt(e.target.value) || 0}}))} className="w-20 bg-stone-900 border border-stone-700 rounded p-1 text-parchment text-xs text-center" /></td>
                            <td className="px-2 py-1"><input type="number" value={lossMatrix[key].material} onChange={e => setLossMatrix(prev => ({...prev, [key]: {...prev[key], material: parseInt(e.target.value) || 0}}))} className="w-20 bg-stone-900 border border-stone-700 rounded p-1 text-parchment text-xs text-center" /></td>
                            <td className="px-2 py-1"><input type="number" value={lossMatrix[key].gold} onChange={e => setLossMatrix(prev => ({...prev, [key]: {...prev[key], gold: parseInt(e.target.value) || 0}}))} className="w-20 bg-stone-900 border border-stone-700 rounded p-1 text-parchment text-xs text-center" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-stone-700 pt-4">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3">Percentage Modifiers (Debuffs)</h4>
                  <p className="text-xs text-stone-400 mb-2">e.g., -0.5 is -50%. Modifies total yields or costs.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Food Return Modifier</label>
                      <input type="number" step="0.1" value={foodReturn} onChange={e => setFoodReturn(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Food Sustain Modifier</label>
                      <input type="number" step="0.1" value={foodSustain} onChange={e => setFoodSustain(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Material Return Modifier</label>
                      <input type="number" step="0.1" value={materialReturn} onChange={e => setMaterialReturn(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Material Sustain Modifier</label>
                      <input type="number" step="0.1" value={materialSustain} onChange={e => setMaterialSustain(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Gold Return Modifier</label>
                      <input type="number" step="0.1" value={goldReturn} onChange={e => setGoldReturn(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Gold Sustain Modifier</label>
                      <input type="number" step="0.1" value={goldSustain} onChange={e => setGoldSustain(parseFloat(e.target.value) || 0)} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-parchment text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-500 italic">
              Select a disaster from the database to configure.
            </div>
          )}
        </div>
      </div>

      {/* Live Stat Tracking Table */}
      <div className="bg-stone-850 rounded border border-stone-700 overflow-hidden">
        <div className="p-3 border-b border-stone-700 bg-stone-900/50 flex justify-between items-center">
          <span className="font-serif font-bold text-parchment">Live Disaster Impact Preview</span>
          {selectedDisaster && <span className="text-xs text-amber-500">Previewing effects of: {selectedDisaster.name} (Cap: {maxCap * 100}%)</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-900 text-stone-400 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">TeamID</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3 text-right">Food</th>
                <th className="px-4 py-3 text-right">Material</th>
                <th className="px-4 py-3 text-right">Gold</th>
                <th className="px-4 py-3 text-right">NAV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-700">
              {teams.map(t => (
                <tr key={t.id} className="hover:bg-stone-800/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gold-400">{t.teamId}</td>
                  <td className="px-4 py-3 text-stone-300">{t.region || 'None'}</td>
                  <td className="px-4 py-3 text-right text-green-400">
                    <div>{t.food}</div>
                    {getSubtext(t, 'food')}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-300">
                    <div>{t.material}</div>
                    {getSubtext(t, 'material')}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400">
                    <div>{t.gold}</div>
                    {getSubtext(t, 'gold')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-parchment">
                    <div>{Math.round(t.gold + (t.food * foodRate) + (t.material * materialRate))}</div>
                    {getNavPreview(t)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Disaster Log */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-gold-400 border-b border-stone-700 pb-2">Historical Disaster Audit Log</h2>
        {logs.length === 0 && <p className="text-stone-500 italic">No disasters launched yet.</p>}
        {logs.map(log => {
          let impacted = {};
          try { impacted = JSON.parse(log.impactedTeams); } catch(e) {}
          
          return (
            <div key={log.id} className="bg-stone-850 rounded border border-stone-700 overflow-hidden shadow-lg">
              <div className="bg-stone-900/80 p-3 border-b border-stone-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-parchment text-lg">{log.disasterName}</span>
                  <span className="text-[10px] bg-stone-700 px-2 py-1 rounded font-mono text-stone-300">ROUND {log.roundNum}</span>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                    !log.isRegional ? 'bg-amber-900/50 text-amber-400 border border-amber-700/50' : 'bg-cyan-900/50 text-cyan-400 border border-cyan-700/50'
                  }`}>
                    {!log.isRegional ? 'CONTINENTAL' : `REGIONAL: ${log.regions || 'Unknown'}`}
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-500">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-900/30 text-stone-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Team</th>
                      <th className="px-4 py-2 text-right">Food Lost</th>
                      <th className="px-4 py-2 text-right">Material Lost</th>
                      <th className="px-4 py-2 text-right">Gold Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-700/50">
                    {Object.entries(impacted).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-stone-500 text-xs italic">No impacts recorded</td>
                      </tr>
                    )}
                    {Object.entries(impacted).map(([teamId, impact]: [string, any]) => (
                      <tr key={teamId} className="hover:bg-stone-800/50 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-stone-300">{teamId}</td>
                        <td className="px-4 py-2 text-right text-red-400 font-bold">{impact.foodLost ? `-${impact.foodLost}` : '-'}</td>
                        <td className="px-4 py-2 text-right text-red-400 font-bold">{impact.materialLost ? `-${impact.materialLost}` : '-'}</td>
                        <td className="px-4 py-2 text-right text-red-400 font-bold">{impact.goldLost ? `-${impact.goldLost}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
