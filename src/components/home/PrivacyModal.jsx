import { XCircle } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">プライバシーポリシー</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>
        <div className="prose prose-sm max-w-none">
          <h4>個人情報の収集について</h4>
          <p>当アプリケーションは、サービス提供のために以下の情報を収集します：</p>
          <ul>
            <li>メールアドレス（認証目的）</li>
            <li>支出データ（アプリ機能提供目的）</li>
            <li>設定情報（アプリ機能提供目的）</li>
          </ul>

          <h4>情報の利用目的</h4>
          <p>収集した情報は以下の目的でのみ利用します：</p>
          <ul>
            <li>サービスの提供・運営</li>
            <li>ユーザー認証</li>
            <li>データの保存・同期</li>
          </ul>

          <h4>情報の保護</h4>
          <p>お客様の個人情報は、Firebase Authenticationおよび Firebase Firestoreにより適切に暗号化・保護されています。</p>

          <h4>情報の第三者提供</h4>
          <p>当アプリケーションは、お客様の個人情報を第三者に提供することはありません。</p>

          <h4>お問い合わせ</h4>
          <p>プライバシーポリシーに関するお問い合わせは、開発者までご連絡ください。</p>
        </div>
      </div>
    </div>
  );
}
