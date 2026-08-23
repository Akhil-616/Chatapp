import {
  MessageSquare,
  Bell,
  Search,
  User,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function Sidebar({ activeTab, setActiveTab, onGoHome }) {
  const wsContext = useWebSocket();
  const unreadCount = wsContext?.unreadCount || 0;

  const menuItems = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'directory', label: 'Directory', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="group/sidebar fixed top-0 left-0 h-screen z-40 bg-[#FFFCF5] border-r border-[rgba(23,20,15,0.1)] transition-all duration-300 w-16 hover:w-56 flex flex-col justify-between p-3 select-none overflow-hidden font-['Inter'] shadow-xs">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center space-x-3 px-1 py-1">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-sm shadow-xs border border-[rgba(23,20,15,0.1)]">
            CJ
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <h1 className="font-['Space_Grotesk'] font-bold text-sm text-[#17140F] leading-tight">ConnectJutti</h1>
            <p className="text-[10px] text-[#8A8275] font-medium">Campus Network</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#17140F] text-[#FFFCF5] shadow-xs'
                    : 'text-[#6B6355] hover:text-[#17140F] hover:bg-[#FAF6ED]'
                }`}
              >
                <div className="relative min-w-[1.25rem] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-[#EFA23D] text-[#17140F] text-[9px] font-['Space_Mono'] font-bold px-1.5 py-0.2 rounded-full group-hover/sidebar:hidden">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap flex-1 text-left flex items-center justify-between font-['Space_Grotesk'] font-bold">
                  {item.label}
                  {item.badge && (
                    <span className="bg-[#EFA23D] text-[#17140F] text-[10px] font-['Space_Mono'] px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-1 pt-4 border-t border-[rgba(23,20,15,0.08)]">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#17140F] text-[#FFFCF5] shadow-xs'
              : 'text-[#6B6355] hover:text-[#17140F] hover:bg-[#FAF6ED]'
          }`}
        >
          <Settings className="w-5 h-5 min-w-[1.25rem]" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap font-['Space_Grotesk'] font-bold">
            Settings
          </span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-[#6B6355] hover:text-[#17140F] hover:bg-[#FAF6ED] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 min-w-[1.25rem]" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap font-['Space_Grotesk'] font-bold">
            Home Page
          </span>
        </button>
      </div>
    </aside>
  );
}
