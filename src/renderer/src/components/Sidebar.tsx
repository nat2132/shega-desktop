import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, 
  Receipt, Users, BarChart3, Settings, 
  LogOut, RefreshCcw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Sidebar = () => {
  const { t, theme } = useSettings();
  
  const navItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard },
    { id: 'inventory', path: '/inventory', icon: Package },
    { id: 'sales', path: '/sales', icon: ShoppingCart },
    { id: 'logistics', path: '/adjustments', icon: RefreshCcw },
    { id: 'customers', path: '/customers', icon: Users },
    { id: 'analytics', path: '/analytics', icon: BarChart3 },
    { id: 'expense', path: '/expenses', icon: Receipt },
  ];

  return (
    <aside className="w-[80px] hidden md:flex flex-col h-full border-r bg-white/40 backdrop-blur-2xl saturate-150 border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] flex-shrink-0 z-40 transition-all duration-300">
      
      {/* Brand Logo */}
      <div className="pt-8 pb-12 flex justify-center">
        <div className="w-12 h-12 bg-retail-orange rounded-[14px] flex items-center justify-center shadow-lg shadow-retail-orange/30 group cursor-pointer hover:rotate-6 transition-transform">
          <span className="text-white font-black text-2xl tracking-tighter">R</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={t(`tabs.${item.id}`)}
            className={({ isActive }) => `
              w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] transition-all duration-300 group relative
              ${isActive 
                ? 'bg-retail-black text-white shadow-xl shadow-black/10 scale-105' 
                : 'text-retail-gray-300 hover:text-retail-black hover:bg-retail-gray-100'}
            `}
          >
            <item.icon size={22} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
            
            <div className="absolute left-[75px] px-3 py-1.5 rounded-lg bg-retail-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
              {t(`tabs.${item.id}`)}
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="pb-8 pt-4 space-y-4 px-3">
        <NavLink
            to="/settings"
            title={t('tabs.settings')}
            className={({ isActive }) => `
              w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] transition-all duration-300 group relative
              ${isActive ? 'bg-retail-gray-100 text-retail-black' : 'text-retail-gray-300 hover:text-retail-black hover:bg-retail-gray-100'}
            `}
          >
            <Settings size={22} strokeWidth={2.5} />
        </NavLink>
        
        <button className="w-14 h-14 mx-auto flex items-center justify-center rounded-[18px] text-retail-gray-300 hover:text-red-500 hover:bg-red-50 transition-all group">
          <LogOut size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
