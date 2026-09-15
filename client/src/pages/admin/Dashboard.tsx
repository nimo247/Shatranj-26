import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../socket';
import { Play, Pause, Square, RotateCcw, Save, FolderOpen, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SaveItem {
  filename: string;
  displayName: string;
  isBackup: boolean;
  size: number;
  mtime: string;
  meta: {
    savedAt?: string;
    gameState?: string;
    teamCount?: number;
    orderCount?: number;
  } | null;
}

export default function Dashboard() {
  const { token } = useAdminAuth();

  const [gameState, setGameState] = useState<'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED'>('NOT_STARTED');
  const [loading, setLoading] = useState(false);

  // Save / Load state
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [savesList, setSavesList] = useState<SaveItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('backup.json');
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/game/state');
      const data = await res.json();
      if (data.state) setGameState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSaves = useCallback(async () => {
    if (!token) return;

    setLoadingSaves(true);
    try {
      const res = await fetch('/api/game/saves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.saves) {
        setSavesList(data.saves);
        if (data.saves.length > 0 && !data.saves.some((s: SaveItem) => s.filename === selectedFile)) {
          setSelectedFile(data.saves[0].filename);
        }
      }
    } catch (e) {
      console.error('Failed to load saves list', e);
    } finally {
      setLoadingSaves(false);
    }
  }, [token, selectedFile]);

  useEffect(() => {
    fetchState();
    fetchSaves();
    const s = getSocket(token);
    const handleGameStateUpdate = (newState: any) => {
      setGameState(newState);
    };
    s.on('game_state_update', handleGameStateUpdate);
    return () => {
      s.off('game_state_update', handleGameStateUpdate);
    };
  }, [token, fetchSaves]);

  const handleSetState = async (newState: string) => {
    if (newState === 'NOT_STARTED' && !confirm('WARNING: Are you sure you want to RESET the game? This will permanently wipe ALL onboarded teams, player orders, escrow balances, and trade mails, resetting the realm to a completely blank slate.')) {
      return;
    }

    if (!token) {
      alert('Admin session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/game/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ state: newState })
      });
      setGameState(newState as any);
    } catch (err) {
      alert('Failed to update game state');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!token) {
      alert('Admin session expired. Please log in again.');
      return;
    }

    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: saveName.trim() || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccessMsg(`Saved as ${data.filename}`);
        setSaveName('');
        fetchSaves();
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      } else {
        alert(data.error || 'Failed to save snapshot');
      }
    } catch (err: any) {
      alert('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadGame = async () => {
    if (!selectedFile || !token) return;

    const isAutoBackup = selectedFile === 'backup.json';
    const msg = isAutoBackup
      ? 'Are you sure you want to load the live Auto-Backup? Current memory will be atomically synchronized to the latest 1-minute snapshot.'
      : `Are you sure you want to restore '${selectedFile}'? This will atomically replace all current ledger orders, team balances, and game state.`;

    if (!confirm(msg)) return;

    setRestoring(true);
    setRestoreSuccessMsg(null);
    try {
      const res = await fetch('/api/game/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename: selectedFile })
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreSuccessMsg(`Restored from ${selectedFile} successfully!`);
        fetchState();
        setTimeout(() => setRestoreSuccessMsg(null), 5000);
      } else {
        alert(data.error || 'Failed to load save');
      }
    } catch (err: any) {
      alert('Load error: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const getStatusBadge = () => {
    switch (gameState) {
      case 'RUNNING':
        return <span className="bg-green-800 text-green-200 border border-green-500 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider animate-pulse">Running / Trading Active</span>;
      case 'PAUSED':
        return <span className="bg-yellow-800 text-yellow-200 border border-yellow-500 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">Paused / Trading Frozen</span>;
      case 'ENDED':
        return <span className="bg-crimson-700 text-red-200 border border-red-500 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">Ended / Realm Locked</span>;
      default:
        return <span className="bg-stone-800 text-stone-300 border border-stone-600 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">Not Started / Setup Mode</span>;
    }
  };

  const selectedSaveMeta = savesList.find(s => s.filename === selectedFile)?.meta;

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-gold-500 font-bold">Imperial Realm Control</h1>
          <p className="text-stone-400 text-sm mt-1">Supervise game flow, execute state transitions, and manage persistent snapshots.</p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Game State Control Buttons */}
      <div className="grid grid-cols-2 gap-6">
        {/* Start Button */}
        <button 
          disabled={loading || gameState === 'RUNNING'}
          onClick={() => handleSetState('RUNNING')}
          className="p-8 bg-green-950/80 border-2 border-green-600 rounded-xl shadow-2xl hover:bg-green-900 text-xl font-bold flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-green-300 hover:scale-[1.02]"
        >
          <Play size={36} className="text-green-400" />
          <span>START GAME</span>
          <span className="text-xs font-normal text-stone-400">Enables Socket order creation & trading</span>
        </button>

        {/* Pause Button */}
        <button 
          disabled={loading || gameState !== 'RUNNING'}
          onClick={() => handleSetState('PAUSED')}
          className="p-8 bg-yellow-950/80 border-2 border-yellow-600 rounded-xl shadow-2xl hover:bg-yellow-900 text-xl font-bold flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-yellow-300 hover:scale-[1.02]"
        >
          <Pause size={36} className="text-yellow-400" />
          <span>PAUSE GAME</span>
          <span className="text-xs font-normal text-stone-400">Freezes all active trading instantly</span>
        </button>

        {/* End Button */}
        <button 
          disabled={loading || gameState === 'ENDED' || gameState === 'NOT_STARTED'}
          onClick={() => handleSetState('ENDED')}
          className="p-8 bg-red-950/80 border-2 border-crimson-700 rounded-xl shadow-2xl hover:bg-red-900 text-xl font-bold flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-red-300 hover:scale-[1.02]"
        >
          <Square size={36} className="text-crimson-700" />
          <span>END GAME</span>
          <span className="text-xs font-normal text-stone-400">Concludes game & locks final NAV standings</span>
        </button>

        {/* Reset Button */}
        <button 
          disabled={loading}
          onClick={() => handleSetState('NOT_STARTED')}
          className="p-8 bg-stone-850 border-2 border-stone-600 rounded-xl shadow-2xl hover:bg-stone-800 text-xl font-bold flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-40 text-stone-300 hover:scale-[1.02]"
        >
          <RotateCcw size={36} className="text-stone-400" />
          <span>RESET GAME</span>
          <span className="text-xs font-normal text-stone-400">Completely purges all teams, orders & mail</span>
        </button>
      </div>

      {/* SAVE & LOAD GAME SECTION */}
      <div className="bg-stone-850 border border-gold-600/30 rounded-xl p-6 shadow-2xl space-y-6">
        <div className="border-b border-stone-700 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="text-gold-500" size={24} />
            <h2 className="text-xl font-serif font-bold text-gold-500">State Archival & Restoration</h2>
          </div>
          <span className="text-xs text-stone-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-700">
            Atomic JSON Engine • Auto-Backup: 1 min
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. SAVE GAME PANEL */}
          <div className="bg-stone-900/80 p-5 rounded-lg border border-stone-700 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-stone-200 font-serif font-bold text-base mb-1">
                <Save size={18} className="text-gold-400" />
                <span>Save Current Game State</span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Creates a discrete JSON snapshot in <code className="text-gold-400 font-mono">/saves</code> capturing all teams, orders, mails, and game status.
              </p>

              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Save Label / Note (Optional)
              </label>
              <input 
                type="text" 
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., round_1_end or summit_prep"
                className="w-full bg-stone-950 border border-stone-700 rounded p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSaveGame}
                disabled={saving}
                className="w-full bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold py-2.5 px-4 rounded shadow flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? 'Writing Snapshot...' : 'Save Game'}</span>
              </button>

              {saveSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-950/70 border border-green-600 p-2 rounded">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="truncate">{saveSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. LOAD GAME PANEL */}
          <div className="bg-stone-900/80 p-5 rounded-lg border border-stone-700 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 text-stone-200 font-serif font-bold text-base">
                  <FolderOpen size={18} className="text-gold-400" />
                  <span>Load Game Snapshot</span>
                </div>
                <button 
                  onClick={fetchSaves} 
                  disabled={loadingSaves}
                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center space-x-1"
                  title="Refresh saves list"
                >
                  <RefreshCw size={12} className={loadingSaves ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Choose from available discrete saves in <code className="text-gold-400 font-mono">/saves</code> or restore the live auto-backup.
              </p>

              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Select Loadable File
              </label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded p-2.5 text-sm text-parchment focus:outline-none focus:border-gold-500 font-mono"
              >
                {savesList.map((s) => (
                  <option key={s.filename} value={s.filename}>
                    {s.displayName} {s.meta?.savedAt ? `(${new Date(s.meta.savedAt).toLocaleTimeString()})` : ''}
                  </option>
                ))}
              </select>

              {/* Selected Snapshot Preview */}
              {selectedSaveMeta && (
                <div className="mt-3 bg-stone-950/60 p-2.5 rounded border border-stone-800 text-xs text-stone-400 grid grid-cols-2 gap-2">
                  <div>Status: <span className="text-parchment font-semibold">{selectedSaveMeta.gameState || 'N/A'}</span></div>
                  <div>Teams: <span className="text-parchment font-semibold">{selectedSaveMeta.teamCount}</span></div>
                  <div>Orders: <span className="text-parchment font-semibold">{selectedSaveMeta.orderCount}</span></div>
                  <div>Saved: <span className="text-parchment font-semibold">{selectedSaveMeta.savedAt ? new Date(selectedSaveMeta.savedAt).toLocaleTimeString() : 'N/A'}</span></div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleLoadGame}
                disabled={restoring || savesList.length === 0}
                className="w-full bg-stone-700 hover:bg-stone-600 border border-gold-500/50 text-parchment font-bold py-2.5 px-4 rounded shadow flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
              >
                <FolderOpen size={18} className="text-gold-400" />
                <span>{restoring ? 'Restoring State...' : 'Load Selected Game'}</span>
              </button>

              {restoreSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-950/70 border border-green-600 p-2 rounded">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="truncate">{restoreSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Master Protocol Guide */}
      <div className="bg-stone-850 border border-stone-700 rounded-lg p-6 shadow-xl text-stone-300 space-y-3">
        <h3 className="text-lg font-serif text-gold-500 font-bold">Game Master Protocol Guide</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-stone-400">
          <li><strong>START:</strong> Opens WebSocket channels for player-to-player trading and escrow locks.</li>
          <li><strong>PAUSE:</strong> Blocks new order creation and order fulfillment without altering existing open orders or balances.</li>
          <li><strong>END:</strong> Permanently halts trading. Players can view their final NAV and completed trade history.</li>
          <li><strong>RESET:</strong> Performs a complete wipe: drops all onboarded player teams, clears all trade mail, removes player orders, and restores clean Admin standing orders.</li>
          <li><strong>SAVE / LOAD:</strong> Creates discrete point-in-time snapshots in <code className="text-gold-400">/saves</code>. You can load any previous save or the live 1-minute auto-backup at any time without restarting the server.</li>
        </ul>
      </div>

    </div>
  );
}
