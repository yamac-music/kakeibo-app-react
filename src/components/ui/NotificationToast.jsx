const TYPE_STYLES = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-slate-700 text-white'
};

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`rounded-lg px-4 py-3 shadow-lg ${TYPE_STYLES[notification.type] || TYPE_STYLES.info}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm"
            aria-label="通知を閉じる"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
