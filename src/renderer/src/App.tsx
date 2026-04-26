import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Expenses from './pages/Expenses'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Adjustments from './pages/Adjustments'
import { useAuth } from './context/AuthContext'

function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const { unlock } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(pin)) {
      onUnlock();
    } else {
      setError('Invalid Access Credentials');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-12 text-center space-y-12">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-retail-orange rounded-[28px] flex items-center justify-center shadow-2xl shadow-retail-orange/40">
             <span className="text-white font-black text-4xl tracking-tighter">R</span>
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-black text-retail-black tracking-tighter mb-4">RETAIL COMMAND</h1>
          <p className="text-retail-gray-300 text-[10px] font-black uppercase tracking-[0.4em]">AUTHENTICATION REQUIRED</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
             <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
              className="w-full bg-retail-gray-100 rounded-[32px] text-center text-6xl tracking-[0.6em] py-10 font-black border-4 border-transparent focus:border-retail-black transition-all outline-none"
              placeholder="0000"
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
          </div>
          
          <button type="submit" className="w-full py-8 bg-retail-black text-white rounded-[32px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">
            Unlock Terminal
          </button>
        </form>

        <p className="text-[9px] text-retail-gray-200 font-black uppercase tracking-[0.2em] pt-12">Authorized Access Only • Shega Enterprise OS</p>
      </div>
    </div>
  );
}

function App() {
  const { isLocked, hasPin } = useAuth();
  const [unlocked, setUnlocked] = React.useState(false);

  if (hasPin && isLocked && !unlocked) {
    return <PinLockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      {/* Global Ambient lighting to make liquid glass pop everywhere */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
         <div className="absolute -top-20 left-0 w-[600px] h-[600px] bg-retail-orange/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
         <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '15s' }} />
         <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-retail-orange/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/adjustments" element={<Adjustments />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
