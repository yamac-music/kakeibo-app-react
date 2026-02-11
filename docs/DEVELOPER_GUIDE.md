# React初心者向け 開発者ガイド

このドキュメントは、React初心者の開発者がこの家計簿アプリを「動かす」「理解する」「小さく改修する」ための案内です。

## 目的とゴール
- ローカルで起動し、主要画面の動きを把握できる
- どのファイルを触れば何が変わるかが分かる
- 小さな変更（カテゴリ追加、文言変更など）を安全に行える

## まず動かす（デモモード）
Firebaseを用意していなくても、デモモードで動作確認できます。

```bash
npm install
npm run dev
```

- `http://localhost:5173/app?demo=true` にアクセス
- Firebase未設定でも動作します（データはブラウザのlocalStorageに保存されるため、保証はありません）

## Firebaseを使う場合の準備
1) `.env.local` を作成

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

2) Firestoreルールを反映
- ルールは `firestore.rules` を使用

## 全体構成（まずここを把握）
- エントリポイント: `src/main.jsx`
  - `BrowserRouter` と `AuthProvider` を初期化
  - GitHub Pages向けに `basename` を設定
- ルーティング: `src/App.jsx`
  - `/landing` や `/app` の画面切り替えを定義
  - `demo=true` でデモモードに切り替え
- 認証: `src/contexts/AuthContext.jsx`
  - Firebase Authの状態管理
  - `login` / `logout` / `signup` を提供
- Firebase初期化: `src/firebase.js`
  - 環境変数の検証と `isFirebaseAvailable` の判定
- メイン機能: `src/components/Home.jsx`
  - 支出管理・予算・精算・インポート/エクスポート
- ランディング: `src/components/LandingPage.jsx`
  - LPとCTA導線
- 入力検証: `src/utils/validation.js`
- セキュリティ補助: `src/utils/csrf.js`, `src/utils/encryption.js`

## ルーティングと画面
- `/landing`: ランディングページ
- `/login` / `/signup` / `/forgot-password`: 認証
- `/app`: 家計簿本体

補足:
- Firebaseが未設定の場合、`/login` などはランディングに誘導されます
- `/app?demo=true` で強制的にデモモードにできます

## データの流れ（支出・設定）
- Firestoreの保存先: `artifacts/{appId}/users/{userId}/...`
  - 支出: `expenses`
  - 設定: `settings/userNames`, `settings/budgets`
- 支出データの主な項目:
  - `amount`, `category`, `payerId`, `description`, `date`, `createdAt`, `updatedAt`, `uid`
  - 旧形式の `payer` 文字列は読み込み時に互換処理されます
- デモモードでは `localStorage`（暗号化対応）に保存

## React初心者が迷いやすいポイント
- `useState`: 画面の状態（入力値・モーダル開閉など）
- `useEffect`: Firebaseの購読や初期読み込み
- `useMemo` / `useCallback`: 計算結果や関数の再生成抑制（`Home.jsx` 内）
- Context: `AuthContext` で認証状態をどこでも参照

## よくある小さな変更例
1) カテゴリを追加する
- `src/components/Home.jsx` の `CATEGORIES` 配列に追記

2) 入力制限を変える
- `src/utils/validation.js` の `VALIDATION_LIMITS` を変更

5) データ層（Firestore/localStorage）を調整する
- `src/features/expenses/repositories/` 配下を編集

3) ランディングの文言を変える
- `src/components/LandingPage.jsx` のテキストを編集

4) デモモード表示文を調整する
- `src/App.jsx` の `DemoModeWrapper` を編集

## テストと品質チェック
```bash
npm run lint
npm run test:run
```

- テストは `src/test` 配下
- まずは `Login.test.jsx` など小さなテストから触るのがおすすめ

## トラブルシュートの起点
- Firebaseが有効にならない: `src/firebase.js` のログと `.env.local` を確認
- 403/権限エラー: `firestore.rules` の `uid` チェックを確認
- GitHub Pagesで画面が真っ白: `src/main.jsx` の `basename` を確認

---

必要なら、このガイドに「画面操作スクショ」や「改修レシピ（数行でできる変更）」を追加します。
