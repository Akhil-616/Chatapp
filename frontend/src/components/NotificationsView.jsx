import { MessageSquare, ArrowRight, Check, CheckCheck, BellOff } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function NotificationsView({ onOpenConversation }) {
  const {
    notifications = [],
    dismissNotification,
    markAllNotificationsAsViewed,
    profilesMap = {},
  } = useWebSocket();

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F6F2EA] text-[#17140F] p-8 pl-24 max-w-4xl font-['Inter']">
      <div className="mb-8 flex items-end justify-between border-b border-[rgba(23,20,15,0.08)] pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-['Space_Grotesk'] font-extrabold tracking-tight text-[#17140F]">
              Notifications
            </h1>
            {notifications.length > 0 && (
              <span className="bg-[#17140F] text-[#FFFCF5] text-xs font-['Space_Mono'] font-bold px-2.5 py-0.5 rounded-full">
                {notifications.length} NEW
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B6355] mt-1">
            Real notifications for messages received while you were offline.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsViewed}
            className="inline-flex items-center space-x-1.5 text-xs font-['Space_Grotesk'] font-bold text-[#17140F] bg-[#FFFCF5] hover:bg-[#FAF6ED] px-3.5 py-2 rounded-xl border border-[rgba(23,20,15,0.12)] shadow-2xs transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#1B6C5D]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] text-center shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6ED] border border-[rgba(23,20,15,0.08)] flex items-center justify-center text-[#8A8275] shadow-2xs">
            <BellOff className="w-6 h-6 text-[#8A8275]" />
          </div>
          <h2 className="text-lg font-['Space_Grotesk'] font-bold text-[#17140F]">
            All caught up!
          </h2>
          <p className="text-xs text-[#6B6355] max-w-sm leading-relaxed">
            You have no unread offline notifications. When peers send you messages while you are offline, alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((n) => {
            const senderUsername = n.from || 'Peer';
            const senderDisplayName =
              profilesMap[senderUsername.toLowerCase()] || senderUsername;

            return (
              <div
                key={n.id}
                className="flex items-start justify-between p-5 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] hover:border-[rgba(23,20,15,0.22)] shadow-xs transition group"
              >
                <div className="flex items-start space-x-4 min-w-0 flex-1 pr-4">
                  <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[rgba(23,20,15,0.08)] text-[#1B6C5D] mt-0.5 shadow-2xs shrink-0">
                    <MessageSquare className="w-4 h-4 text-[#1B6C5D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#17140F] leading-relaxed">
                      <strong className="font-bold text-[#17140F]">{senderDisplayName}</strong> has sent you a message.
                    </p>
                    <span className="text-[11px] font-['Space_Mono'] text-[#8A8275] mt-1.5 block">
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Notification Actions: Completed reading / Mark as read & View conversation */}
                <div className="flex items-center space-x-2 shrink-0 self-center">
                  <button
                    type="button"
                    title="Completed reading"
                    onClick={() => dismissNotification(n.id)}
                    className="inline-flex items-center space-x-1 text-xs font-['Space_Grotesk'] font-bold text-[#6B6355] hover:text-[#17140F] bg-[#FAF6ED] hover:bg-[#F2ECDE] px-3 py-2 rounded-xl border border-[rgba(23,20,15,0.1)] transition cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#1B6C5D]" />
                    <span className="hidden sm:inline">Mark as Read</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dismissNotification(n.id);
                      if (onOpenConversation) {
                        onOpenConversation(senderUsername);
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs font-['Space_Grotesk'] font-bold text-[#FFFCF5] bg-[#17140F] hover:bg-[#2b2519] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <span>Open Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
