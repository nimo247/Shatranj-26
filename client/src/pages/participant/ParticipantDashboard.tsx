import { useState, useEffect } from 'react';
import { useTeamAuth } from '../../contexts/TeamAuthContext';
import { getSocket } from '../../socket';
import { Wheat, Pickaxe, Coins, Mail, LogOut, X } from 'lucide-react';
import OrderLedger from './OrderLedger';
import CardsPanel from './Cards';

export default function ParticipantDashboard() {
  const { token, logout } = useTeamAuth();
  const socket = getSocket(token);
  
  const [teamState, setTeamState] = useState<any>(null);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [diffs, setDiffs] = useState({ food: 0, material: 0, gold: 0 });
  const [gameState, setGameState] = useState<'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED'>('NOT_STARTED');
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'market' | 'cards'>('market');

  const fetchTeamData = () => {
    if (!token) return;
    fetch('/api/team/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          logout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setTeamState(data);
      })
      .catch(() => {
        logout();
      });
  };

  useEffect(() => {
    if (!token) {
      logout();
      return;
    }

    // Immediately fetch current team state via REST for instantaneous render
    fetchTeamData();

    // Fetch initial orders
    fetch('/api/team/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setOrders(data))
      .catch(() => {});

    const handleTeamHudUpdate = (data: any) => {
      fetchTeamData();
      setTeamState((prev: any) => {
        if (prev) {
          setDiffs({
            food: data.food - prev.food,
            material: data.material - prev.material,
            gold: data.gold - prev.gold
          });
          setTimeout(() => setDiffs({ food: 0, material: 0, gold: 0 }), 2000);
        }
        return prev; // `fetchTeamData` will override this soon
      });
    };

    const handleGameStateUpdate = (state: any) => {
      setGameState(state);
    };

    const handleLedgerUpdate = (data: any) => {
      setOrders(data);
    };

    const handleAuthError = (msg: any) => {
      alert(`Session Error: ${msg}`);
      logout();
    };

    const handleErrorMessage = (msg: any) => {
      alert(`Imperial Notice: ${msg}`);
    };

    socket.on('team_hud_update', handleTeamHudUpdate);
    socket.on('game_state_update', handleGameStateUpdate);
    socket.on('ledger_update', handleLedgerUpdate);
    socket.on('auth_error', handleAuthError);
    socket.on('error_message', handleErrorMessage);
    socket.on('disaster_refresh', fetchTeamData);
    socket.on('cards_updated', fetchTeamData);

    return () => {
      socket.off('team_hud_update', handleTeamHudUpdate);
      socket.off('game_state_update', handleGameStateUpdate);
      socket.off('ledger_update', handleLedgerUpdate);
      socket.off('auth_error', handleAuthError);
      socket.off('error_message', handleErrorMessage);
      socket.off('disaster_refresh', fetchTeamData);
      socket.off('cards_updated', fetchTeamData);
    };
  }, [token, socket, logout]);

  if (!token) {
    logout();
    return null;
  }
  if (!teamState) return <div className="p-8 text-center text-parchment">Loading The Realm...</div>;

  const unreadMails = teamState.mails?.filter((m: any) => !m.isRead).length || 0;
  
  const getAdminBuyRate = (resType: 'FOOD' | 'MATERIAL') => {
    const adminBuyOrder = orders.find(o => o.isAdminOrder && o.orderType === 'BUY' && o.resourceType === resType);
    return adminBuyOrder ? adminBuyOrder.price : 1;
  };

  const nav = Math.round(teamState.gold + (teamState.food * getAdminBuyRate('FOOD')) + (teamState.material * getAdminBuyRate('MATERIAL')));

  const handleOpenMail = () => {
    setMailboxOpen(true);
    socket?.emit('mark_mails_read');
  };

  const DiffFloat = ({ val }: { val: number }) => {
    if (val === 0) return null;
    return (
      <span className={`absolute -top-6 left-4 font-bold text-lg animate-bounce ${val > 0 ? 'text-green-500' : 'text-crimson-700'}`}>
        {val > 0 ? '+' : ''}{val}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-stone-900 text-parchment font-sans relative overflow-hidden">
      {/* HUD Navbar */}
      <header className="h-16 bg-stone-850 border-b border-stone-700 flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-serif text-gold-500 font-bold">{teamState.teamName}</h1>
          <span className="text-sm italic text-stone-400">({teamState.region})</span>
        </div>

        <div className="flex items-center space-x-8">
          <div className="relative flex flex-col justify-center">
            <div className="flex items-center space-x-2">
              <Wheat className="text-green-600" />
              <span className="text-xl font-bold">{teamState.food - teamState.escrowFood}</span>
              <DiffFloat val={diffs.food} />
            </div>
            {teamState.escrowFood > 0 && <span className="text-[10px] text-stone-400 ml-8 -mt-1 leading-none whitespace-nowrap">Total: {teamState.food} | Escrow: -{teamState.escrowFood}</span>}
          </div>
          <div className="relative flex flex-col justify-center">
            <div className="flex items-center space-x-2">
              <Pickaxe className="text-stone-400" />
              <span className="text-xl font-bold">{teamState.material - teamState.escrowMaterial}</span>
              <DiffFloat val={diffs.material} />
            </div>
            {teamState.escrowMaterial > 0 && <span className="text-[10px] text-stone-400 ml-8 -mt-1 leading-none whitespace-nowrap">Total: {teamState.material} | Escrow: -{teamState.escrowMaterial}</span>}
          </div>
          <div className="relative flex flex-col justify-center">
            <div className="flex items-center space-x-2">
              <Coins className="text-gold-500" />
              <span className="text-xl font-bold">{teamState.gold - teamState.escrowGold}</span>
              <DiffFloat val={diffs.gold} />
            </div>
            {teamState.escrowGold > 0 && <span className="text-[10px] text-stone-400 ml-8 -mt-1 leading-none whitespace-nowrap">Total: {teamState.gold} | Escrow: -{teamState.escrowGold}</span>}
          </div>
          <div className="flex items-center space-x-2 border-l border-stone-700 pl-8">
            <span className="text-stone-400 uppercase text-sm font-bold">NAV</span>
            <span className="text-xl font-bold text-gold-400">{nav.toLocaleString()}</span>
          </div>

          <button onClick={handleOpenMail} className="relative p-2 text-stone-300 hover:text-gold-500 transition-colors">
            <Mail />
            {unreadMails > 0 && (
              <span className="absolute top-0 right-0 bg-crimson-700 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {unreadMails}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => { logout(); }}
            className="p-2 text-stone-500 hover:text-crimson-700 transition-colors"
          >
            <LogOut />
          </button>
        </div>
      </header>

      {/* Thematic Game State Banners */}
      {gameState === 'PAUSED' && (
        <div className="bg-yellow-900/90 border-b-4 border-gold-600 text-gold-200 p-3 text-center shadow-2xl relative z-20 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
          <p className="font-serif font-bold text-lg tracking-wide uppercase drop-shadow-md">
            The Sun Sets on the Market. By Decree of The Imperial Citadel, the Bazaars are Sealed.
          </p>
        </div>
      )}
      {gameState === 'ENDED' && (
        <div className="bg-crimson-900/90 border-b-4 border-red-500 text-red-200 p-3 text-center shadow-2xl relative z-20">
          <p className="font-serif font-bold text-lg tracking-wide uppercase drop-shadow-md">
            The Era has Concluded. Final Navigations stand etched in stone.
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 bg-stone-850 border-r border-stone-700 flex flex-col p-4 space-y-2 z-10">
          <button 
            onClick={() => setActiveTab('market')}
            className={`w-full text-left px-3 py-2 rounded font-bold transition-colors ${activeTab === 'market' ? 'bg-gold-600 text-stone-900' : 'text-stone-400 hover:text-parchment hover:bg-stone-800'}`}
          >
            Marketplace
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`w-full text-left px-3 py-2 rounded font-bold transition-colors ${activeTab === 'cards' ? 'bg-gold-600 text-stone-900' : 'text-stone-400 hover:text-parchment hover:bg-stone-800'}`}
          >
            Cards
          </button>
        </aside>
        
        <main className="flex-1 overflow-auto p-6 relative">
          {activeTab === 'market' && socket && <OrderLedger context={{ socket, teamState, gameState, orders }} />}
          {activeTab === 'cards' && <CardsPanel teamState={teamState} gameState={gameState} />}
        </main>
      </div>

      {/* Mailbox Overlay */}
      {mailboxOpen && (
        <div className="absolute top-0 right-0 h-full w-96 bg-stone-850 border-l border-stone-700 shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-900">
            <h2 className="text-xl font-serif text-gold-500 flex items-center gap-2"><Mail /> Raven Scrolls</h2>
            <button onClick={() => setMailboxOpen(false)} className="text-stone-400 hover:text-white"><X /></button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {teamState.mails?.length === 0 && <p className="text-stone-500 text-center">No scrolls received.</p>}
            {teamState.mails?.map((m: any) => (
              <div key={m.id} className="bg-stone-900 p-3 rounded border border-stone-700">
                <h3 className="text-gold-400 font-bold text-sm mb-1">{m.title}</h3>
                <p className="text-parchment text-sm">{m.body}</p>
                <span className="text-xs text-stone-500 mt-2 block">{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
