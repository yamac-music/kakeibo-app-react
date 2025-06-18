# React Firebase 家計簿アプリ

Firebase Authentication対応の家計簿アプリケーションです。Docker環境で開発・テスト・本番デプロイが可能です。

## 🌐 デモサイト

**[GitHub Pagesでライブデモを体験](https://yamac-music.github.io/kakeibo-app-react/)**

※ デモサイトでは匿名認証が有効になっており、すぐに試すことができます。

![家計簿アプリ](https://via.placeholder.com/800x400?text=Kakeibo+App+Screenshot)

## ✨ 主な機能

- ✅ **Firebase Authentication**: メール/パスワード認証
- 📊 **支出管理**: 日々の支出を簡単に記録・編集・削除
- 🧮 **簡易電卓**: 金額入力フォームに内蔵された計算機能
- 💰 **予算管理**: カテゴリ別の月間予算設定と実績比較
- 👥 **二人での共有**: ユーザー名をカスタマイズして支払者を管理
- 🏠 **家計簿共有**: 複数アカウント間での家計簿データの共有機能
- 📧 **招待システム**: メールベースでの家計簿グループ招待・承認機能
- 📈 **データ可視化**: 円グラフで支出の内訳を視覚的に確認
- ⚖️ **精算機能**: 二人の支払額を自動計算し、精算すべき金額を表示
- 💾 **データバックアップ**: JSON形式でのエクスポート・インポート機能
- 🔒 **プライベート**: Firebase認証によるセキュアなデータ管理
- 🐳 **Docker対応**: 開発・テスト・本番環境をコンテナ化

## 🛠️ 技術スタック

- **フロントエンド**: React 19 + Vite
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **ルーティング**: React Router
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **グラフ**: Recharts
- **テスト**: Vitest + Testing Library
- **コンテナ**: Docker + Docker Compose
- **本番**: Nginx (静的配信)

## 🐳 Docker環境での使用方法（推奨）

### 前提条件
- Docker
- Docker Compose

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/kakeibo-app.git
cd kakeibo-app
```

### 2. Firebase設定

`.env.local`ファイルにFirebase設定を記入：

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. 開発環境

```bash
# 開発サーバー起動（ホットリロード対応）
docker-compose --profile dev up --build

# バックグラウンドで起動
docker-compose --profile dev up --build -d

# ログ確認
docker-compose --profile dev logs -f app-dev

# 停止
docker-compose --profile dev down
```

開発サーバーは http://localhost:5173 でアクセス可能です。

### 4. テスト実行

```bash
# テスト実行
docker-compose --profile test run --rm app-test npm run test:run

# インタラクティブテスト（ウォッチモード）
docker-compose --profile test run --rm app-test npm run test

# カバレッジ付きテスト
docker-compose --profile test run --rm app-test npm run test:coverage
```

### 5. 本番環境

```bash
# 本番ビルド＆起動
docker-compose --profile prod up --build

# バックグラウンドで起動
docker-compose --profile prod up --build -d
```

本番環境は http://localhost:80 でアクセス可能です。

## 🚀 ローカル開発（非Docker）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Firestore Database を有効化
3. Authentication でメール/パスワード認証を有効化
4. `.env.local` ファイルに Firebase設定を記入

### 3. Firestoreセキュリティルールの設定

Firebase Console の Firestore Database > ルール にて以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 個人家計簿データ（後方互換性のため維持）
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == userId &&
                          (resource == null || !resource.data.keys().hasAny(['uid']) || resource.data.uid == request.auth.uid) &&
                          (request.data == null || !request.data.keys().hasAny(['uid']) || request.data.uid == request.auth.uid);
    }
    
    // 共有家計簿データ（新しい構造）
    // グループデータ
    match /artifacts/{appId}/groups/{groupId} {
      allow read, write: if request.auth != null && 
                          (resource == null || 
                           request.auth.uid in resource.data.members ||
                           request.auth.uid == resource.data.createdBy);
    }
    
    // グループの支出・設定データ
    match /artifacts/{appId}/groups/{groupId}/{subcollection}/{docId} {
      function isGroupMember() {
        return request.auth != null && 
               exists(/databases/$(database)/documents/artifacts/$(appId)/userGroups/$(request.auth.uid)/groups/$(groupId));
      }
      
      function isPersonalGroup() {
        return groupId.matches('personal_.*') && 
               groupId == 'personal_' + request.auth.uid;
      }
      
      allow read, write: if isGroupMember() || isPersonalGroup();
    }
    
    // ユーザーのグループ一覧
    match /artifacts/{appId}/userGroups/{userId}/groups/{groupId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 招待データ
    match /artifacts/{appId}/invitations/{invitationId} {
      allow create: if request.auth != null && request.data.inviterUid == request.auth.uid;
      allow read: if request.auth != null && 
                   (resource.data.inviterUid == request.auth.uid ||
                    resource.data.inviteeEmail == request.auth.token.email);
      allow update: if request.auth != null && 
                     resource.data.inviteeEmail == request.auth.token.email &&
                     request.data.diff(resource.data).affectedKeys().hasOnly(['status']);
    }
  }
}
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションを確認できます。

## 📦 ビルド・デプロイ

### ローカルビルド

```bash
npm run build
```

### Vercelでのデプロイ

1. [Vercel](https://vercel.com) にサインアップ
2. GitHubリポジトリを連携
3. 環境変数を設定
4. デプロイ

### Netlifyでのデプロイ

1. [Netlify](https://netlify.com) にサインアップ
2. GitHubリポジトリを連携
3. ビルドコマンド: `npm run build`
4. 公開ディレクトリ: `dist`
5. 環境変数を設定

### GitHub Pagesでのデプロイ

1. GitHubリポジトリの **Settings** → **Pages** にアクセス
2. **Source** を "GitHub Actions" に設定
3. **Secrets and variables** → **Actions** で以下の環境変数を設定：
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID
   ```
4. mainブランチにプッシュすると自動でデプロイされます

## 📁 プロジェクト構成

```
src/
├── components/
│   ├── auth/              # 認証関連コンポーネント
│   │   ├── Login.jsx      # ログイン画面
│   │   ├── Signup.jsx     # 新規登録画面
│   │   ├── ForgotPassword.jsx # パスワードリセット
│   │   └── PrivateRoute.jsx   # 認証保護ルート
│   └── Home.jsx           # メインアプリケーション
├── contexts/
│   └── AuthContext.jsx   # 認証コンテキスト
├── test/                  # テストファイル
│   ├── setup.js          # テスト設定
│   ├── App.test.jsx      # アプリケーションテスト
│   ├── AuthContext.test.jsx # 認証テスト
│   └── Login.test.jsx    # ログインテスト
├── firebase.js           # Firebase設定
└── App.jsx              # ルーティング設定

# Docker関連
├── Dockerfile            # マルチステージビルド対応
├── docker-compose.yml    # 開発・テスト・本番環境定義
├── nginx.conf           # 本番環境Nginx設定
└── .dockerignore        # Docker除外ファイル
```

## 🧪 テスト

テストは以下を含みます：
- 認証フローのテスト
- コンポーネントのレンダリングテスト
- Firebase未設定時のデモモード表示テスト

```bash
# ローカルでのテスト実行
npm run test            # ウォッチモード
npm run test:run        # 一回実行
npm run test:coverage   # カバレッジ付き

# Dockerでのテスト実行
docker-compose --profile test run --rm app-test npm run test:run
```

## 📱 使用方法

### 基本機能
1. **新規登録**: `/signup` でアカウントを作成
2. **ログイン**: メールアドレスとパスワードでログイン
3. **ユーザー名設定**: 設定ボタンから二人の名前をカスタマイズ
4. **支出記録**: 右下の赤いボタンから支出を記録
   - 🧮 **電卓機能**: 金額入力欄の右側の電卓アイコンをクリックして、計算しながら金額を入力
5. **予算設定**: 左上の目標ボタンから月間予算を設定
6. **データ管理**: 設定画面からデータのエクスポート・インポートが可能

### 家計簿共有機能
1. **グループ作成**: 右上の共有アイコンから「グループ管理」タブで新しいグループを作成
2. **メンバー招待**: グループオーナーとして、メールアドレスでメンバーを招待
3. **招待承認**: 招待を受けたユーザーは「招待一覧」タブで承認・辞退を選択
4. **共有家計簿**: グループメンバー全員が同じ家計簿データを共有・編集可能
5. **グループ切り替え**: ヘッダーに現在のグループ名が表示され、複数グループを管理可能

## 🔒 プライバシー・セキュリティ

- すべてのデータは Firebase Firestore に暗号化されて保存されます
- 各ユーザーのデータは完全に分離されており、他のユーザーからアクセスできません
- 匿名認証を使用しているため、個人情報の収集は最小限です
- 詳細は アプリ内の「プライバシーポリシー」をご確認ください

## 🤝 コントリビュート

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🐛 バグ報告・機能要望

バグ報告や機能要望は [GitHub Issues](https://github.com/your-username/kakeibo-app/issues) にてお願いします。

## 👨‍💻 作者

**YamaC**

---

⭐ このプロジェクトが役に立った場合は、スターを付けていただけると嬉しいです！
