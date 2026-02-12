import { useMemo, useState } from 'react';
import {
  Download,
  Save,
  ShieldCheck,
  Upload,
  XCircle
} from 'lucide-react';
function sortClosureHistory(monthClosures) {
  return Object.entries(monthClosures || {})
    .sort(([monthA], [monthB]) => monthB.localeCompare(monthA));
}

export default function SettingsModal({
  displayNames,
  monthClosures,
  backupRecords,
  suggestionsEnabled,
  onSaveDisplayNames,
  onToggleSuggestions,
  onCreateBackup,
  onRestoreBackup,
  onExportData,
  onImportData,
  onZaimImport,
  fileInputRef,
  zaimFileInputRef,
  onClose,
  onShowPrivacy,
  onShowTerms,
  appVersion,
  commitSha
}) {
  const [tempUser1Name, setTempUser1Name] = useState(displayNames.user1);
  const [tempUser2Name, setTempUser2Name] = useState(displayNames.user2);

  const closureHistory = useMemo(
    () => sortClosureHistory(monthClosures),
    [monthClosures]
  );

  const handleSaveDisplayNamesClick = () => {
    onSaveDisplayNames(tempUser1Name, tempUser2Name);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">設定</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h4 className="font-medium text-gray-700 mb-3">ユーザー名設定</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ユーザー1の名前</label>
                <input
                  type="text"
                  value={tempUser1Name}
                  onChange={(e) => setTempUser1Name(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ユーザー1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ユーザー2の名前</label>
                <input
                  type="text"
                  value={tempUser2Name}
                  onChange={(e) => setTempUser2Name(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ユーザー2"
                />
              </div>
            </div>
            <button
              onClick={handleSaveDisplayNamesClick}
              className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              ユーザー名を保存
            </button>
          </section>

          <section>
            <h4 className="font-medium text-gray-700 mb-3">データ管理</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={onExportData}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                データをエクスポート
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                データをインポート
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />

            <div className="mt-3">
              <button
                onClick={() => zaimFileInputRef.current?.click()}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Zaim CSVインポート
              </button>
            </div>
            <input
              ref={zaimFileInputRef}
              type="file"
              accept=".csv"
              onChange={onZaimImport}
              className="hidden"
            />

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={onCreateBackup}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                復元ポイントを作成
              </button>
              <label className="w-full flex items-center justify-between border border-slate-300 rounded-md px-3 py-2 text-sm">
                <span>固定費提案を有効化</span>
                <input
                  type="checkbox"
                  checked={suggestionsEnabled !== false}
                  onChange={(event) => onToggleSuggestions(event.target.checked)}
                />
              </label>
            </div>
          </section>

          <section>
            <h4 className="font-medium text-gray-700 mb-2">復元ポイント</h4>
            {backupRecords.length === 0 ? (
              <div className="text-sm text-slate-500">復元ポイントはまだありません。</div>
            ) : (
              <div className="space-y-2">
                {backupRecords.map((backup) => (
                  <div key={backup.id} className="border border-slate-200 rounded-md p-2 text-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{backup.reason}</div>
                      <div className="text-slate-500">{new Date(backup.createdAt).toLocaleString('ja-JP')}</div>
                    </div>
                    <button
                      onClick={() => onRestoreBackup(backup.id)}
                      className="px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700"
                    >
                      適用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="font-medium text-gray-700 mb-2">月次締め履歴</h4>
            {closureHistory.length === 0 ? (
              <div className="text-sm text-slate-500">締め履歴はありません。</div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {closureHistory.map(([monthKey, record]) => {
                  const reopenCount = Array.isArray(record.reopenHistory) ? record.reopenHistory.length : 0;
                  return (
                    <div key={monthKey} className="border border-slate-200 rounded-md p-2 text-sm">
                      <div className="font-medium">{monthKey}</div>
                      <div className="text-slate-600">状態: {record.status}</div>
                      <div className="text-slate-600">締め日時: {record.closedAt ? new Date(record.closedAt).toLocaleString('ja-JP') : '-'}</div>
                      <div className="text-slate-600">精算額: {record.settlementSnapshot?.amount ? `${record.settlementSnapshot.amount.toLocaleString()}円` : '-'}</div>
                      <div className="text-slate-600">解除回数: {reopenCount}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h4 className="font-medium text-gray-700 mb-3">その他</h4>
            <div className="space-y-2">
              <button
                onClick={onShowPrivacy}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                プライバシーポリシー
              </button>
              <button
                onClick={onShowTerms}
                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                利用規約
              </button>
            </div>
          </section>

          <section>
            <h4 className="font-medium text-gray-700 mb-1">バージョン情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>バージョン: {appVersion}</p>
              <p>コミット: {commitSha}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

