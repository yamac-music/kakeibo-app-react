import { useState } from 'react';
import { Download, Save, Upload, XCircle } from 'lucide-react';

export default function SettingsModal({
  displayNames,
  onSaveDisplayNames,
  onExportData,
  onImportData,
  fileInputRef,
  onClose,
  onShowPrivacy,
  onShowTerms,
  appVersion,
  commitSha
}) {
  const [tempUser1Name, setTempUser1Name] = useState(displayNames.user1);
  const [tempUser2Name, setTempUser2Name] = useState(displayNames.user2);

  const handleSave = () => {
    onSaveDisplayNames(tempUser1Name, tempUser2Name);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">設定</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">ユーザー名設定</h4>
            <div className="space-y-3">
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
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                ユーザー名を保存
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">データ管理</h4>
            <div className="space-y-3">
              <button
                onClick={onExportData}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                データをエクスポート
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                データをインポート
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportData}
                className="hidden"
              />
            </div>
          </div>

          <div>
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
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">バージョン情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>バージョン: {appVersion}</p>
              <p>コミット: {commitSha}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
