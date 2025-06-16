# マルチステージビルド
# ステージ1: 開発・ビルド用
FROM node:20-alpine AS development

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー（依存関係のキャッシュを活用）
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# 開発環境用のポートを公開
EXPOSE 5173

# 開発サーバーを起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ステージ2: プロダクション用
FROM node:20-alpine AS build

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 本番用依存関係のみをインストール
RUN npm ci --only=production && npm cache clean --force

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# ステージ3: 本番環境用（nginx）
FROM nginx:alpine AS production

# ビルドされたファイルをnginxに配置
COPY --from=build /app/dist /usr/share/nginx/html

# nginx設定ファイルをコピー（SPAのルーティング対応）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート80を公開
EXPOSE 80

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]