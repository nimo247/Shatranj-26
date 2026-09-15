import { useState } from 'react';

import { Socket } from 'socket.io-client';
import { ArrowUpDown, Search } from 'lucide-react';

export default function OrderLedger({ context }: { context: { socket: Socket; teamState: any; gameState: string; orders: any[] } }) {
  const { socket, teamState, gameState, orders } = context;

  // Filters requested in rawsystem.txt
  const [filterRes, setFilterRes] = useState('ALL'); // ALL | FOOD | MATERIAL
  const [filterType, setFilterType] = useState('ALL'); // ALL | BUY | SELL
  const [filterVisibility, setFilterVisibility] = useState('ALL'); // ALL | PUBLIC | PRIVATE
  const [searchTeam, setSearchTeam] = useState(''); // Text search
  const [priceSort, setPriceSort] = useState<'NONE' | 'ASC' | 'DESC'>('NONE'); // Switchable high-to-low / low-to-high

  const [newOrder, setNewOrder] = useState({ type: 'SELL', resource: 'FOOD', amount: '', price: '', target: '' });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('create_order', {
      resourceType: newOrder.resource,
      orderType: newOrder.type,
      amount: newOrder.amount,
      price: newOrder.price,
      targetTeamId: newOrder.target === '' ? null : newOrder.target
    });
    setNewOrder({ ...newOrder, amount: '', price: '', target: '' });
  };

  const handleAccept = (orderId: number) => {
    socket.emit('accept_order', orderId);
  };

  const handleCancel = (orderId: number) => {
    socket.emit('cancel_order', orderId);
  };

  const togglePriceSort = () => {
    if (priceSort === 'NONE') setPriceSort('DESC');
    else if (priceSort === 'DESC') setPriceSort('ASC');
    else setPriceSort('NONE');
  };

  // Base categorization
  const adminOrders = orders.filter(o => o.isAdminOrder);
  const targetedAtMe = orders.filter(o => o.targetTeamId === teamState.id && o.creatorId !== teamState.id);
  const myOrders = orders.filter(o => o.creatorId === teamState.id);
  const publicOrders = orders.filter(o => !o.isAdminOrder && !o.targetTeamId && o.creatorId !== teamState.id);

  // Apply all combined multi-toggle filters to Public & Private orders
  const applyFilters = (list: any[]) => {
    return list.filter(o => {
      if (filterRes !== 'ALL' && o.resourceType !== filterRes) return false;
      if (filterType !== 'ALL' && o.orderType !== filterType) return false;
      if (searchTeam.trim() !== '') {
        const query = searchTeam.toLowerCase();
        const teamMatch = o.creator?.teamName?.toLowerCase().includes(query);
        const regionMatch = o.creator?.region?.toLowerCase().includes(query);
        if (!teamMatch && !regionMatch) return false;
      }
      return true;
    });
  };

  let filteredPublic = applyFilters(publicOrders);
  let filteredPrivate = applyFilters(targetedAtMe);
  let filteredMine = applyFilters(myOrders);

  // Apply Sorting by Price (Unit Price)
  const sortOrders = (list: any[]) => {
    if (priceSort === 'NONE') return list;
    return [...list].sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;
      return priceSort === 'ASC' ? priceA - priceB : priceB - priceA;
    });
  };

  filteredPublic = sortOrders(filteredPublic);
  filteredPrivate = sortOrders(filteredPrivate);
  filteredMine = sortOrders(filteredMine);

  const OrderRow = ({ o, type }: { o: any, type: 'ADMIN' | 'PRIVATE' | 'PUBLIC' | 'MINE' }) => {
    const isMine = type === 'MINE';
    
    let rowClass = "border-b border-stone-700 hover:bg-stone-800 transition-colors";
    if (type === 'ADMIN') rowClass += " bg-stone-800/80 border-gold-600/50";
    if (type === 'PRIVATE') rowClass += " bg-stone-800/50 border-blue-500/50";
    if (isMine) rowClass += " bg-stone-900/50 opacity-70";

    return (
      <tr className={rowClass}>
        <td className="p-4 border-r border-stone-700/50">
          <div className="font-bold text-parchment">
            {type === 'ADMIN' ? 'The Imperial Citadel' : isMine ? 'You' : o.creator.teamName}
          </div>
          {!isMine && type !== 'ADMIN' && <div className="text-sm text-stone-500 italic">{o.creator.region}</div>}
        </td>
        <td className={`p-4 border-r border-stone-700/50 font-bold ${o.orderType === 'BUY' ? 'text-green-500' : 'text-crimson-700'}`}>
          {o.orderType}
        </td>
        <td className="p-4 border-r border-stone-700/50 font-serif text-lg">{o.resourceType}</td>
        <td className="p-4 border-r border-stone-700/50 font-mono font-bold">{o.amount}</td>
        <td className="p-4 border-r border-stone-700/50 text-gold-400 font-bold font-mono">
          {o.price} G/u
        </td>
        <td className="p-4 border-r border-stone-700/50 text-gold-400 font-bold font-mono">
          {Math.round(o.amount * o.price)} Gold
        </td>
        <td className="p-4 text-center">
          {isMine ? (
            <button 
              disabled={gameState !== 'RUNNING'}
              onClick={() => handleCancel(o.id)} 
              className="px-4 py-1 bg-crimson-700 text-white rounded hover:bg-red-600 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
          ) : (
            <button 
              disabled={gameState !== 'RUNNING'}
              onClick={() => handleAccept(o.id)} 
              className={`px-4 py-1 rounded text-white font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed ${
                o.orderType === 'BUY' ? 'bg-crimson-700 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              {o.orderType === 'BUY' ? 'SELL TO THEM' : 'BUY FROM THEM'}
            </button>
          )}
        </td>
      </tr>
    );
  };

  const CitadelTradeRow = ({ type, adminOrders, socket, gameState }: { type: 'BUY_FROM_ADMIN' | 'SELL_TO_ADMIN', adminOrders: any[], socket: Socket, gameState: string }) => {
    const [resType, setResType] = useState<'FOOD' | 'MATERIAL'>('FOOD');
    const [amtStr, setAmtStr] = useState('');

    const citadelAction = type === 'BUY_FROM_ADMIN' ? 'SELL' : 'BUY';
    const defaultRate = citadelAction === 'SELL' ? 2 : 1;
    const activeOrder = adminOrders.find(o => o.orderType === citadelAction && o.resourceType === resType);
    const rate = activeOrder ? activeOrder.price : defaultRate;
    const amount = parseInt(amtStr) || 0;
    const total = Math.round(amount * rate);

    const handleTrade = () => {
      if (amount <= 0) return;
      socket.emit('interact_admin_order', { action: type, resourceType: resType, amount });
      setAmtStr('');
    };

    const isClosed = activeOrder && activeOrder.status === 'CLOSED';

    if (isClosed) {
      if (type === 'SELL_TO_ADMIN') return null; // Don't duplicate the closed notice
      return (
        <tr className="border-b border-stone-700 bg-stone-900/80 opacity-50 pointer-events-none">
          <td colSpan={7} className="p-4 text-center font-bold text-stone-500 uppercase tracking-widest">
            Imperial Trade Closed
          </td>
        </tr>
      );
    }

    return (
      <tr className="border-b border-stone-700 bg-stone-800/80 border-gold-600/50">
        <td className="p-4 border-r border-stone-700/50">
          <div className="font-bold text-gold-500">The Imperial Citadel</div>
          <div className="text-xs text-stone-400 mt-1">
            {type === 'BUY_FROM_ADMIN' ? 'Selling' : 'Buying'} at rate <span className="font-bold text-gold-400">{rate} G/u</span>
          </div>
        </td>
        <td className={`p-4 border-r border-stone-700/50 font-bold ${type === 'BUY_FROM_ADMIN' ? 'text-crimson-700' : 'text-green-500'}`}>
          {type === 'BUY_FROM_ADMIN' ? 'SELL' : 'BUY'}
        </td>
        <td className="p-4 border-r border-stone-700/50">
          <select 
            value={resType} 
            onChange={e => setResType(e.target.value as 'FOOD' | 'MATERIAL')}
            className="bg-stone-900 border border-stone-600 text-parchment rounded px-2 py-1 focus:outline-none focus:border-gold-500 w-full"
          >
            <option value="FOOD">Food</option>
            <option value="MATERIAL">Material</option>
          </select>
        </td>
        <td className="p-4 border-r border-stone-700/50">
          <input 
            type="number"
            min="1"
            placeholder="Amount"
            value={amtStr}
            onChange={e => setAmtStr(e.target.value)}
            className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-parchment font-mono focus:outline-none focus:border-gold-500"
          />
        </td>
        <td className="p-4 border-r border-stone-700/50 text-gold-400 font-bold font-mono">
          {rate} G/u
        </td>
        <td className="p-4 border-r border-stone-700/50 text-gold-400 font-bold font-mono">
          {total > 0 ? `${total} Gold` : '--'}
        </td>
        <td className="p-4 text-center">
          <button 
            disabled={gameState !== 'RUNNING' || amount <= 0 || !activeOrder}
            onClick={handleTrade}
            className={`px-4 py-1.5 rounded text-white font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed ${
              type === 'BUY_FROM_ADMIN' ? 'bg-green-600 hover:bg-green-500' : 'bg-crimson-700 hover:bg-red-600'
            }`}
          >
            {type === 'BUY_FROM_ADMIN' ? 'BUY' : 'SELL'}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Filter Controls as specified in rawsystem.txt */}
      <div className="bg-stone-850 border border-stone-700 p-4 rounded-lg mb-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-3 text-stone-400" />
            <input 
              type="text"
              placeholder="Filter by Team or Region..."
              value={searchTeam}
              onChange={e => setSearchTeam(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-600 rounded text-sm text-parchment placeholder-stone-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Resource Filter */}
          <select 
            value={filterRes} 
            onChange={e => setFilterRes(e.target.value)} 
            className="bg-stone-900 border border-stone-600 rounded px-3 py-1.5 text-sm text-parchment focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">All Resources</option>
            <option value="FOOD">Food</option>
            <option value="MATERIAL">Material</option>
          </select>

          {/* Buy/Sell Filter */}
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            className="bg-stone-900 border border-stone-600 rounded px-3 py-1.5 text-sm text-parchment focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">Buy & Sell</option>
            <option value="BUY">Buying Only</option>
            <option value="SELL">Selling Only</option>
          </select>

          {/* Visibility Filter: Public / Private / All */}
          <select 
            value={filterVisibility} 
            onChange={e => setFilterVisibility(e.target.value)} 
            className="bg-stone-900 border border-stone-600 rounded px-3 py-1.5 text-sm text-parchment focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public Only</option>
            <option value="PRIVATE">Private Only</option>
          </select>

          {/* Price Sorting Switchable */}
          <button 
            onClick={togglePriceSort}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold border transition ${
              priceSort === 'NONE' 
                ? 'bg-stone-900 border-stone-600 text-stone-400 hover:text-parchment'
                : 'bg-gold-600 text-stone-900 border-gold-500'
            }`}
          >
            <ArrowUpDown size={14} />
            {priceSort === 'NONE' && 'Price Sort'}
            {priceSort === 'DESC' && 'Price: High → Low'}
            {priceSort === 'ASC' && 'Price: Low → High'}
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="flex-1 bg-stone-850 border border-stone-700 rounded-t-lg overflow-auto shadow-xl">
        <table className="w-full text-left border-collapse relative">
          <thead className="bg-stone-900 text-gold-500 sticky top-0 shadow z-10">
            <tr>
              <th className="p-4 border-b border-r border-stone-700">Origin</th>
              <th className="p-4 border-b border-r border-stone-700">Type</th>
              <th className="p-4 border-b border-r border-stone-700">Resource</th>
              <th className="p-4 border-b border-r border-stone-700">Amount</th>
              <th className="p-4 border-b border-r border-stone-700">Unit Price</th>
              <th className="p-4 border-b border-r border-stone-700">Total Value</th>
              <th className="p-4 border-b text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Permanent Citadel Trading Hub */}
            <CitadelTradeRow type="BUY_FROM_ADMIN" adminOrders={adminOrders} socket={socket} gameState={gameState} />
            <CitadelTradeRow type="SELL_TO_ADMIN" adminOrders={adminOrders} socket={socket} gameState={gameState} />
            
            {/* 2. Private Targeted Orders (Stickied right below Citadel) */}
            {filterVisibility !== 'PUBLIC' && filteredPrivate.map(o => <OrderRow key={o.id} o={o} type="PRIVATE" />)}
            
            {/* 3. My open orders */}
            {filteredMine.map(o => <OrderRow key={o.id} o={o} type="MINE" />)}
            
            {/* 4. Filtered Public Orders */}
            {filterVisibility !== 'PRIVATE' && filteredPublic.map(o => <OrderRow key={o.id} o={o} type="PUBLIC" />)}

            {filteredPublic.length === 0 && filteredMine.length === 0 && filteredPrivate.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-500 italic">No orders match the active filter criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Row (Bottom Sticky) */}
      <div className="bg-stone-900 border-x border-b border-stone-700 rounded-b-lg p-4 shadow-xl">
        <form onSubmit={handleCreateOrder} className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-xs text-stone-400 mb-1">Action</label>
            <select 
              value={newOrder.type} 
              onChange={e => setNewOrder({...newOrder, type: e.target.value})} 
              className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-parchment font-bold"
            >
              <option value="SELL">I want to SELL</option>
              <option value="BUY">I want to BUY</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-stone-400 mb-1">Amount</label>
            <input 
              required 
              type="number" 
              min="1" 
              value={newOrder.amount} 
              onChange={e => setNewOrder({...newOrder, amount: e.target.value})} 
              className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-parchment text-center font-mono" 
              placeholder="0" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-stone-400 mb-1">Resource</label>
            <select 
              value={newOrder.resource} 
              onChange={e => setNewOrder({...newOrder, resource: e.target.value})} 
              className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-parchment font-serif text-lg"
            >
              <option value="FOOD">Food</option>
              <option value="MATERIAL">Material</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-stone-400 mb-1 flex items-center justify-between">
              <span>Unit Price (G/u)</span>
              {Number(newOrder.amount) > 0 && Number(newOrder.price) > 0 && (
                <span className="text-gold-400 font-mono font-bold">
                  ={Math.round(Number(newOrder.amount) * Number(newOrder.price))}G
                </span>
              )}
            </label>
            <input 
              required 
              type="number" 
              min="0.01"
              step="0.01" 
              value={newOrder.price} 
              onChange={e => setNewOrder({...newOrder, price: e.target.value})} 
              className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-parchment text-center text-gold-400 font-bold font-mono" 
              placeholder="G/unit" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-stone-400 mb-1">Target Team ID (Optional)</label>
            <input 
              type="text" 
              value={newOrder.target} 
              onChange={e => setNewOrder({...newOrder, target: e.target.value.toUpperCase()})} 
              className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-parchment italic" 
              placeholder="Leave empty for Public" 
            />
          </div>
          <button 
            type="submit" 
            disabled={!newOrder.amount || !newOrder.price || gameState !== 'RUNNING'}
            className="bg-gold-600 text-stone-900 font-bold px-8 py-2 rounded hover:bg-gold-500 h-[42px] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center min-w-[160px]"
          >
            {gameState !== 'RUNNING' ? 'MARKET FROZEN' : 'FORGE ORDER'}
          </button>
        </form>
      </div>
    </div>
  );
}
