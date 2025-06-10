# 二人暮らしの家計簿アプリ

二人で共有する家計簿を管理するWebアプリケーションです。支出の記録・予算管理・データの可視化ができます。

## 🌐 デモサイト

**[GitHub Pagesでライブデモを体験](https://yamac-music.github.io/kakeibo-app-react/)**

※ デモサイトでは匿名認証が有効になっており、すぐに試すことができます。

![家計簿アプリ](https://via.placeholder.com/800x400?text=Kakeibo+App+Screenshot)

## ✨ 主な機能

- 📊 **支出管理**: 日々の支出を簡単に記録・編集・削除
- 💰 **予算管理**: カテゴリ別の月間予算設定と実績比較
- 👥 **二人での共有**: ユーザー名をカスタマイズして支払者を管理
- 📈 **データ可視化**: 円グラフで支出の内訳を視覚的に確認
- ⚖️ **精算機能**: 二人の支払額を自動計算し、精算すべき金額を表示
- 💾 **データバックアップ**: JSON形式でのエクスポート・インポート機能
- 🔒 **プライベート**: Firebase認証によるセキュアなデータ管理

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + Vite
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **グラフ**: Recharts
- **バックエンド**: Firebase (Firestore + Authentication)
- **デプロイ**: Vercel / Netlify 対応

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/kakeibo-app.git
cd kakeibo-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Firestore Database を有効化
3. Authentication で匿名認証を有効化
4. `.env.example` を `.env` にコピーし、Firebase設定を入力

```bash
cp .env.example .env
```

`.env` ファイルに以下の値を設定：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Firestoreセキュリティルールの設定

Firebase Console の Firestore Database > ルール にて以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId} {
      match /settings/userNames {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /settings/budgets {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /expenses/{expenseId} {
        allow read, delete: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId 
                        && request.resource.data.uid == request.auth.uid;
        allow update: if request.auth != null && request.auth.uid == userId 
                        && request.resource.data.uid == request.auth.uid;
      }
    }
  }
}
```

### 5. 開発サーバーの起動

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

## 📱 使用方法

1. **初回利用**: アプリにアクセスすると自動的に匿名ユーザーとして認証されます
2. **ユーザー名設定**: 設定ボタンから二人の名前をカスタマイズできます
3. **支出記録**: 右下の赤いボタンから支出を記録します
4. **予算設定**: 左上の目標ボタンから月間予算を設定できます
5. **データ管理**: 設定画面からデータのエクスポート・インポートが可能です

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
