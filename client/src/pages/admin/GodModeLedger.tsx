import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useState, useEffect } from 'react';
import { getSocket } from '../../socket';
import { Trash2 } from 'lucide-react';

interface Order {
  id: number;
  creator: { teamName: string; region: string; role: string };
  target?: { teamName: string };
  resourceType: string;
  orderType: string;
  amount: number;
  price: number;
  isAdminOrder: boolean;
  status: string;
}

const RateEditor = ({ res, action, order, token }: { res: string, action: string, order: any, token: string | null }) => {
  const defaultRate = action === 'BUY' ? '1' : '2';
  const [rate, setRate] = useState(order ? order.price.toString() : defaultRate);
  const [saved, setSaved] = useState(false);
  
  const currentSavedRate = order ? order.price : Number(defaultRate);
  const isUnsaved = rate !== '' && Number(rate) !== Number(currentSavedRate);
  
  useEffect(() => {
    if (order) setRate(order.price.toString());
  }, [order]);

  const handleUpdate = async () => {
    if (!rate || !token) return;
    const resFetch = await fetch('/api/orders/imperial-rates', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ resourceType: res, orderType: action, price: Number(rate) })
    });
    if (resFetch.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-2">
      <span className={`w-28 font-bold text-sm ${action === 'BUY' ? 'text-green-500' : 'text-crimson-700'}`}>
        Citadel {action}s
      </span>
      <div className="flex-1 relative">
        <input 
          type="number"
          step="0.01"
          min="0"
          value={rate}
          placeholder={defaultRate}
          onChange={e => setRate(e.target.value)}
          className="w-full bg-stone-800 text-gold-400 font-bold px-4 py-2 rounded border border-stone-700 focus:outline-none focus:border-gold-500 font-mono"
        />
        <span className="absolute right-3 top-2.5 text-xs text-stone-500">G/u</span>
        {isUnsaved && (
          <div className="absolute -bottom-4 right-0 text-[10px] text-amber-500 font-bold tracking-wider animate-pulse">
            UNSAVED
          </div>
        )}
      </div>
      <button 
        onClick={handleUpdate}
        className={`font-bold px-4 py-2 rounded transition-all text-sm ${
          saved 
            ? 'bg-green-600 text-white' 
            : 'bg-gold-600 text-stone-900 hover:bg-gold-500'
        }`}
      >
        {saved ? 'Saved!' : 'Update'}
      </button>
    </div>
  );
};

export default function GodModeLedger() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    };
    fetchOrders();

    const s = getSocket(token);
    const handleLedgerUpdate = (data: Order[]) => {
      setOrders(data);
    };
    s.on('ledger_update', handleLedgerUpdate);
    return () => {
      s.off('ledger_update', handleLedgerUpdate);
    };
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this order? Escrow will be released.')) return;
    await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  };

  return (
    <div>
      <h1 className="text-3xl mb-6 font-serif font-bold text-gold-500">God Mode Ledger</h1>
      <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-900 border-b border-stone-700 text-gold-500">
            <tr>
              <th className="p-4 border-r border-stone-700">Origin</th>
              <th className="p-4 border-r border-stone-700">Target</th>
              <th className="p-4 border-r border-stone-700">Action</th>
              <th className="p-4 border-r border-stone-700">Resource</th>
              <th className="p-4 border-r border-stone-700">Amount</th>
              <th className="p-4 border-r border-stone-700">Unit Price</th>
              <th className="p-4 border-r border-stone-700">Total Value</th>
              <th className="p-4 text-center">Manage</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(o => !o.isAdminOrder).map(o => (
              <tr key={o.id} className="border-b border-stone-700 hover:bg-stone-800">
                <td className="p-4 border-r border-stone-700">
                  {o.creator.teamName}
                </td>
                <td className="p-4 border-r border-stone-700 italic text-stone-400">
                  {o.target ? o.target.teamName : 'Public'}
                </td>
                <td className={`p-4 border-r border-stone-700 font-bold ${o.orderType === 'BUY' ? 'text-green-500' : 'text-crimson-700'}`}>
                  {o.orderType}
                </td>
                <td className="p-4 border-r border-stone-700 font-serif text-lg">{o.resourceType}</td>
                <td className="p-4 border-r border-stone-700 font-mono font-bold">{o.amount}</td>
                <td className="p-4 border-r border-stone-700 text-gold-400 font-bold font-mono">{o.price} G/u</td>
                <td className="p-4 border-r border-stone-700 text-gold-400 font-bold font-mono">{o.amount * o.price} Gold</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleDelete(o.id)}
                    className="p-2 text-stone-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {orders.filter(o => !o.isAdminOrder).length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-stone-500">The Ledger is empty.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-stone-850 border border-stone-700 p-6 rounded-lg shadow-xl relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl text-gold-500 font-serif uppercase tracking-widest font-bold">Manage Imperial Rates</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Benchmark Defaults: Citadel Buys @ <span className="text-gold-400 font-bold">1 G/u</span> | Citadel Sells @ <span className="text-gold-400 font-bold">2 G/u</span>
            </p>
          </div>
          {orders.some(o => o.isAdminOrder) && (
            <button
              onClick={async () => {
                if (!token) return;
                await fetch('/api/orders/imperial-trade/toggle', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
              }}
              className={`px-4 py-2 font-bold rounded shadow-lg ${
                orders.find(o => o.isAdminOrder)?.status === 'OPEN'
                  ? 'bg-crimson-700 hover:bg-red-600 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {orders.find(o => o.isAdminOrder)?.status === 'OPEN' ? 'Disable Imperial Trade' : 'Enable Imperial Trade'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {(['FOOD', 'MATERIAL'] as const).map(res => (
            <div key={res} className="bg-stone-900 border border-stone-700 p-4 rounded flex flex-col space-y-4">
              <h3 className="text-lg text-parchment font-bold">{res}</h3>
              {(['BUY', 'SELL'] as const).map(action => {
                const order = orders.find(o => o.isAdminOrder && o.resourceType === res && o.orderType === action);
                return <RateEditor key={action} res={res} action={action} order={order} token={token} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
