import React from 'react';
import {
  MessageSquare,
  Compass,
  Bell,
  Search,
  User,
  Settings,
  ArrowLeft,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 1, onGoHome }) {
  const menuItems = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'directory', label: 'Directory', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="group/sidebar fixed top-0 left-0 h-screen z-40 bg-[#05070a] border-r border-gray-900 transition-all duration-300 w-16 hover:w-56 flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Logo / Brand Header */}
        <div className="flex items-center space-x-3 px-1 py-1">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-sm shadow-md">
            SP
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <h1 className="font-bold text-sm text-white leading-tight">Sajilo Patra</h1>
            <p className="text-[10px] text-gray-400">University Network</p>
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
                className={`w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#161b22] text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
                }`}
              >
                <div className="relative min-w-[1.25rem] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-white text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full group-hover/sidebar:hidden">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap flex-1 text-left flex items-center justify-between">
                  {item.label}
                  {item.badge && (
                    <span className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
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
      <div className="space-y-1 pt-4 border-t border-gray-900">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-[#161b22] text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
          }`}
        >
          <Settings className="w-5 h-5 min-w-[1.25rem]" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Settings
          </span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full flex items-center space-x-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-900/50 transition-all"
        >
          <ArrowLeft className="w-5 h-5 min-w-[1.25rem]" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Home Page
          </span>
        </button>
      </div>
    </aside>
  );
}