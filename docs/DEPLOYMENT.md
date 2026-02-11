# GitHub Pages デプロイ手順

このドキュメントでは、家計簿アプリをGitHub Pagesで公開するための手順を説明します。

## 🔥 Firebase プロジェクトの準備

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `kakeibo-demo`）
4. Google Analyticsは任意で設定
5. プロジェクトを作成

### 2. Firestore Database の設定

1. Firebase Console で「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. 「テストモードで開始」を選択（後でセキュリティルールを設定）
4. リージョンを選択（asia-northeast1 推奨）

### 3. Authentication の設定

1. Firebase Console で「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブで「匿名」を有効化

### 4. Web アプリの追加

1. Firebase Console のプロジェクト概要で「Web」アイコンをクリック
2. アプリ名を入力（例: `Kakeibo Web App`）
3. Firebase Hosting は設定しない
4. 「アプリを登録」をクリック
5. 設定オブジェクトをコピー（後で使用）

### 5. Firestore セキュリティルールの設定

Firebase Console の「Firestore Database」→「ルール」で以下を設定：

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

## 🚀 GitHub Pages の設定

### 1. GitHub リポジトリの設定

1. GitHubリポジトリの **Settings** タブにアクセス
2. 左メニューから **Pages** を選択
3. **Source** を "GitHub Actions" に設定

### 2. GitHub Secrets の設定

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** にアクセス
2. **New repository secret** で以下の環境変数を追加：

```bash
# Firebase設定（先ほどコピーした設定オブジェクトから取得）
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. デプロイの実行

1. 変更をmainブランチにプッシュ
2. GitHub の **Actions** タブで自動デプロイを確認
3. デプロイ完了後、`https://username.github.io/repository-name/` でアクセス可能

## 🛡️ セキュリティ注意事項

- Firebase API キーは公開されますが、Firestore セキュリティルールで適切に保護されています
- 匿名認証を使用しているため、個人情報の収集は最小限です
- 各ユーザーのデータは完全に分離されています

## 🔧 トラブルシューティング

### ビルドエラーが発生する場合

1. GitHub Secrets が正しく設定されているか確認
2. Firebase プロジェクトの設定を再確認
3. Actions タブでエラーログを確認

### アプリにアクセスできない場合

1. GitHub Pages の設定が有効になっているか確認
2. デプロイが完了しているか Actions タブで確認
3. ブラウザのキャッシュをクリア

### Firebase接続エラーが発生する場合

1. Firebase Authentication で匿名認証が有効か確認
2. Firestore Database が作成されているか確認
3. セキュリティルールが正しく設定されているか確認

## 📞 サポート

問題が発生した場合は、GitHub Issues でお問い合わせください。