import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getSocket } from '../../socket';
import DashboardPanel from './Dashboard';
import OnboardingPanel from './Onboarding';
import LeaderboardPanel from './Leaderboard';
import GodModeLedgerPanel from './GodModeLedger';
import CardEnginePanel from './CardEngine';
import RoundEnginePanel from './RoundEnginePanel';
import DisastersPanel from './DisastersPanel';
import { LayoutDashboard, Users, Trophy, BookOpen, LogOut, Database, CheckCircle2, LayoutGrid, Clock, ShieldAlert } from 'lucide-react';

type Panel = 'dashboard' | 'onboarding' | 'leaderboard' | 'ledger' | 'cards' | 'rounds' | 'disasters';

export default function AdminDashboard() {
  const { token, logout } = useAdminAuth();
  const [activePanel, setActivePanel] = useState<Panel>('dashboard');
  const [gameState, setGameState] = useState<string>('NOT_STARTED');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const socket = getSocket(token);

  const fetchBackupStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/game/backup/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.lastBackup) {
        setLastBackupTime(data.lastBackup);
      }
    } catch (err) {
      console.error('Failed to fetch backup status', err);
    }
  }, [token]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/game/backup/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.gameState) setGameState(data.gameState);
        if (data.lastBackup) setLastBackupTime(data.lastBackup);
      } catch (e) {}

      try {
        const res = await fetch('/api/game/ledger', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } catch (e) {}
    };

    fetchInitialData();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const handleGameStateUpdate = (state: string) => {
      setGameState(state);
      if (state === 'RUNNING') {
        fetchBackupStatus();
      }
    };

    const handleBackupUpdate = (data: { lastBackup: string, active: boolean }) => {
      if (data.lastBackup) setLastBackupTime(data.lastBackup);
      fetchBackupStatus();
    };

    const handleLedgerUpdate = (data: any[]) => {
      setOrders(data);
    };

    socket.on('game_state_update', handleGameStateUpdate);
    socket.on('backup_update', handleBackupUpdate);
    socket.on('ledger_update', handleLedgerUpdate);

    return () => {
      socket.off('game_state_update', handleGameStateUpdate);
      socket.off('backup_update', handleBackupUpdate);
      socket.off('ledger_update', handleLedgerUpdate);
    };
  }, [token, socket, fetchBackupStatus]);

  const handleManualBackup = async () => {
    if (gameState !== 'RUNNING' || !token) return;

    setBackupLoading(true);
    setBackupStatus(null);
    try {
      const res = await fetch('/api/game/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLastBackupTime(data.savedAt || new Date().toISOString());
        setBackupStatus('Backup completed!');
        setTimeout(() => setBackupStatus(null), 4000);
      } else {
        if (res.status === 401) {
          alert('Unauthorized: You must log in with the Admin Keyword');
          logout();
        } else {
          alert(data.error || 'Failed to create manual backup');
        }
      }
    } catch (err: any) {
      alert('Error triggering backup: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const getAdminRate = (resType: 'FOOD' | 'MATERIAL', orderType: 'BUY' | 'SELL') => {
    const o = orders.find(x => x.isAdminOrder && x.resourceType === resType && x.orderType === orderType);
    return o ? Number(o.price).toFixed(2) : '0.00';
  };

  const isEngineActive = gameState === 'RUNNING';

  const navItems: { id: Panel; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Engine Control', icon: LayoutDashboard },
    { id: 'disasters', label: 'Disasters', icon: ShieldAlert },
    { id: 'onboarding', label: 'Team Manifest', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'ledger', label: 'Manage Imperial Rates', icon: BookOpen },
    { id: 'cards', label: 'Card Engine', icon: LayoutGrid },
    { id: 'rounds', label: 'Rounds', icon: Clock },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard': return <DashboardPanel />;
      case 'disasters': return <DisastersPanel />;
      case 'onboarding': return <OnboardingPanel />;
      case 'leaderboard': return <LeaderboardPanel />;
      case 'ledger': return <GodModeLedgerPanel />;
      case 'cards': return <CardEnginePanel />;
      case 'rounds': return <RoundEnginePanel gameState={gameState} />;
      default: return <DashboardPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-stone-900 text-parchment font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-850 border-r border-stone-700 flex flex-col">
        <div className="p-6 border-b border-stone-700">
          <h2 className="text-2xl font-serif text-gold-500 font-bold">The Imperial Citadel</h2>
          <p className="text-stone-400 text-sm mt-1">Admin God Mode</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded transition-colors ${
                  activePanel === item.id ? 'bg-gold-600 text-stone-900 font-bold' : 'hover:bg-stone-700 text-parchment'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Imperial Rates */}
        <div className="px-4 py-3 border-t border-stone-700 bg-stone-900/40">
          <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-2">Live Imperial Rates</p>
          <div className="text-xs space-y-2 font-mono">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-green-400">
                <span className="font-bold">BUY Food:</span>
                <span className="text-parchment/80">{getAdminRate('FOOD', 'BUY')} G/u</span>
              </div>
              <div className="flex justify-between items-center text-green-400">
                <span className="font-bold">BUY Materials:</span>
                <span className="text-parchment/80">{getAdminRate('MATERIAL', 'BUY')} G/u</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-red-400">
                <span className="font-bold">SELL Food:</span>
                <span className="text-parchment/80">{getAdminRate('FOOD', 'SELL')} G/u</span>
              </div>
              <div className="flex justify-between items-center text-red-400">
                <span className="font-bold">SELL Materials:</span>
                <span className="text-parchment/80">{getAdminRate('MATERIAL', 'SELL')} G/u</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Backup & System Status */}
        <div className="p-4 border-t border-stone-700 space-y-2.5">
          <button
            onClick={handleManualBackup}
            disabled={!isEngineActive || backupLoading}
            className={`w-full flex items-center justify-center space-x-2 font-serif text-sm font-bold py-2.5 px-3 rounded shadow transition-all ${
              isEngineActive
                ? 'bg-stone-800 hover:bg-stone-700 border border-gold-600/50 text-gold-400 cursor-pointer hover:border-gold-500'
                : 'bg-stone-900/60 border border-stone-800 text-stone-600 cursor-not-allowed opacity-50'
            }`}
            title={isEngineActive ? "Saves an immediate snapshot to backup.json" : "Start the game (RUNNING) to enable manual backup"}
          >
            <Database size={16} className={backupLoading ? 'animate-spin' : isEngineActive ? 'text-gold-400' : 'text-stone-600'} />
            <span>{backupLoading ? 'Backing Up...' : 'Manual Backup'}</span>
          </button>

          {/* Backup Engine Status Tag */}
          <div className="w-full">
            {isEngineActive ? (
              <div className="text-[11px] font-medium text-gold-400/90 bg-stone-900/90 border border-gold-600/30 py-1.5 px-2.5 rounded text-center tracking-wide shadow-inner">
                {lastBackupTime ? (
                  <>Last Backup: <span className="font-mono font-bold text-parchment">{new Date(lastBackupTime).toLocaleTimeString()}</span></>
                ) : (
                  <span className="text-stone-400 italic">No backup taken</span>
                )}
              </div>
            ) : (
              <div className="text-[11px] font-medium text-stone-500 bg-stone-900/80 border border-stone-800 py-1.5 px-2.5 rounded text-center tracking-wide">
                Backup Engine Inactive
              </div>
            )}
          </div>

          {backupStatus && (
            <div className="flex items-center space-x-1.5 text-xs text-green-400 bg-green-950/70 border border-green-700 px-2.5 py-1.5 rounded animate-fade-in justify-center">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>{backupStatus}</span>
            </div>
          )}

          <button 
            onClick={() => logout()}
            className="flex items-center space-x-3 text-crimson-700 hover:text-red-500 w-full p-2.5 rounded hover:bg-stone-800/60 text-sm font-semibold transition-colors mt-2"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-stone-900 p-8">
        {renderPanel()}
      </main>
    </div>
  );
}
