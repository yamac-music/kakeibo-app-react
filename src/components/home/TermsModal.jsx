import { XCircle } from 'lucide-react';

export default function TermsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">利用規約</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>
        <div className="prose prose-sm max-w-none">
          <h4>サービスの利用について</h4>
          <p>当アプリケーションは、個人の家計管理を目的として提供されています。</p>

          <h4>禁止事項</h4>
          <p>以下の行為を禁止します：</p>
          <ul>
            <li>本サービスの妨害行為</li>
            <li>他のユーザーへの迷惑行為</li>
            <li>虚偽の情報の登録</li>
            <li>商業目的での利用</li>
          </ul>

          <h4>免責事項</h4>
          <p>当アプリケーションの使用により生じた損害について、開発者は一切の責任を負いません。</p>

          <h4>サービスの変更・終了</h4>
          <p>開発者は、事前の通知なしにサービスの内容を変更、または終了する場合があります。</p>

          <h4>準拠法</h4>
          <p>本規約は日本法に準拠し、日本の裁判所を専属的合意管轄とします。</p>
        </div>
      </div>
    </div>
  );
}
