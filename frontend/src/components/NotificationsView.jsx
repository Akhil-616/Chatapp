import { User, Sparkles, Heart, Shield } from 'lucide-react';

export default function NotificationsView() {
  const notifications = [
    {
      id: 1,
      icon: User,
      text: (
        <span>
          <strong className="text-white">Akhil Bhandari</strong> sent you a study partnership request for Distributed Systems.
        </span>
      ),
      time: '10 minutes ago',
      actions: true,
    },
    {
      id: 2,
      icon: Sparkles,
      text: (
        <span>
          <strong className="text-white">Campus Affinity Engine</strong> found a 98% match with Kriti Sharma at Tribhuvan University.
        </span>
      ),
      time: '1 hour ago',
    },
    {
      id: 3,
      icon: Heart,
      text: (
        <span>
          <strong className="text-white">Sirjan B.</strong> upvoted your RFC on Dithered Shader Canvas Backgrounds.
        </span>
      ),
      time: '3 hours ago',
    },
    {
      id: 4,
      icon: Shield,
      text: (
        <span>
          <strong className="text-white">Security Guard</strong> Your JWT token was successfully refreshed with Supabase PostgreSQL RLS.
        </span>
      ),
      time: 'Yesterday',
    },
  ];

  return (
    <div className="flex-1 min-h-screen bg-[#030712] text-white p-8 pl-24 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
        <p className="text-sm text-gray-400 mt-1">
          Updates on connection requests and mentions.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className="flex items-start space-x-4 p-4 rounded-xl bg-[#0b0e14] border border-gray-900 hover:border-gray-800 transition"
            >
              <div className="p-2.5 rounded-full bg-gray-900 border border-gray-800 text-gray-300 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-300 leading-relaxed">{n.text}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">{n.time}</span>

                {n.actions && (
                  <div className="flex items-center space-x-2 mt-3">
                    <button className="bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-200 transition">
                      Accept
                    </button>
                    <button className="bg-gray-900 text-gray-400 text-xs font-semibold px-4 py-1.5 rounded-lg hover:text-white transition">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}