const VARIANT_STYLES = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-amber-600 hover:bg-amber-700',
  primary: 'bg-blue-600 hover:bg-blue-700'
};

export default function ConfirmDialog({ state, onConfirm, onCancel }) {
  if (!state) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-800">{state.title}</h3>
        <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{state.message}</p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-white ${VARIANT_STYLES[state.variant || 'primary']}`}
          >
            {state.confirmLabel || '実行'}
          </button>
        </div>
      </div>
    </div>
  );
}
