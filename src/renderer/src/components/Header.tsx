import React from 'react';
import { Search, Bell, ChevronDown, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onSearch }) => {
  const { theme } = useSettings();

  return (
    <header className="h-24 flex items-center justify-between px-8 md:px-16 lg:px-24 max-w-[1800px] mx-auto bg-white/40 backdrop-blur-2xl saturate-150 border-b border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)] sticky top-0 z-30 transition-all">
      
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-retail-black flex items-center gap-2">
          Retail <span className="text-retail-gray-300 font-medium">Inventory</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Currency/Region Selector */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-retail-gray-100 border border-transparent cursor-pointer hover:border-retail-gray-200 transition-all">
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center">
             <img src="https://flagcdn.com/w40/us.png" alt="USA" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-retail-black">USD</span>
          <ChevronDown size={14} className="text-retail-gray-300" />
        </div>

        {/* Action Grid */}
        <div className="flex items-center gap-1 md:gap-2">
          <button className="w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center hover:bg-retail-gray-100 transition-all">
            <Search size={20} className="text-retail-black" />
          </button>
          
          <button className="w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center hover:bg-retail-gray-100 transition-all relative">
            <Bell size={20} className="text-retail-black" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-retail-black text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
              2
            </div>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-retail-gray-200">
          <div className="w-10 md:w-12 h-10 md:h-12 rounded-2xl bg-retail-gray-200 overflow-hidden cursor-pointer hover:ring-4 ring-retail-orange/10 transition-all">
             <img 
               src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
               alt="Profile" 
               className="w-full h-full object-cover"
             />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
