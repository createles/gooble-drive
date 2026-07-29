# Gobble Drive 📁☁️

[English](README.md) | [日本語](README.ja.md)

> [The Odin Project - File Uploader Lesson](https://www.theodinproject.com/lessons/nodejs-file-uploader) の課題として開発されたフルスタックの Gobble Drive クローンアプリ。

**Gobble Drive** は、クラウドファイルストレージとフォルダ管理を提供するモダンでレスポンシブな Web アプリケーションです。Node.js、Express、PostgreSQL、Prisma ORM、Supabase Storage を使用して構築されており、ファイルのアップロード、階層フォルダの整理、コピー/移動、期限付き公開共有リンクの作成、スター機能、ドライブ内検索など、Google Drive で馴染みのあるワークフローを備えています。

---

## 🌟 主な機能

- 🔐 **ユーザー認証とセッションの永続化**
  - Passport.js (`passport-local`) と `bcryptjs` ハッシュ化による安全な新規登録およびログイン機能。
  - `@quixo3/prisma-session-store` を介した PostgreSQL バックエンドによる永続的セッションストレージ。
  - オンボーディング時にスターターファイルを含むウェルカムチュートリアルを自動表示。

- 📁 **フォルダ & ファイル管理**
  - **階層化フォルダ**: ネストされたサブフォルダを作成してドライブを整理。
  - **ドラッグ＆ドロップ / モーダルアップロード**: Supabase クラウドストレージへの最大10MBのファイルアップロード（画像、PDF、テキスト等をサポート）。
  - **再帰的コピー & 移動**: ネストされたファイル参照を維持したまま、フォルダツリー全体を深層再帰的にコピー。
  - **循環移動防止ガード**: 自らのサブフォルダ内への不正な移動を防止するツリー検証機能。
  - **深層再帰的削除**: Supabase ストレージおよび Postgres からファイルを安全にカスケード削除。

- ⭐ **スター付き & 最近のファイル表示**
  - ファイルやフォルダにスターを付けて「スター付き」ビューから迅速にアクセス。
  - アクティビティタイムライン（*今日*、*過去7日間*、*過去30日間*）ごとにファイルを分類表示。

- 🔗 **期限付きパブリック共有**
  - 有効期限（例: 1日、7日、30日）を指定して、個別のファイルやフォルダの共有リンクを生成。
  - リンク有効期限内であれば未ログインの訪問者でも安全に閲覧・ダウンロード可能な公開ページ。

- 🔍 **ナビバーリアルタイム検索**
  - タイピングに合わせて一致するファイルやフォルダを即座に返す検索 API。

- 🎨 **レスポンシブ EJS UI & マイクロインタラクション**
  - Vanilla CSS、モーダル、パンくずリストナビゲーション、コンテキストメニューを備えた現代的な Google Drive 風デザイン。

---

## 🛠️ 技術スタック

| 分野 | 使用技術 |
| :--- | :--- |
| **バックエンドフレームワーク** | [Node.js](https://nodejs.org/) (ES Modules), [Express 5](https://expressjs.com/) |
| **データベース & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM v7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| **クラウドファイルストレージ** | [Supabase Storage](https://supabase.com/storage) |
| **認証 & セッション** | [Passport.js](http://www.passportjs.org/), `express-session`, `bcryptjs`, `@quixo3/prisma-session-store` |
| **ファイルアップロード処理** | [Multer](https://github.com/expressjs/multer) (Memory Storage) |
| **ビューエンジン & UI** | [EJS](https://ejs.co/), カスタム Vanilla CSS |
| **開発ツール** | Nodemon, Dotenv |

---

## 📁 プロジェクト構造

```
gooble-drive/
├── config/
│   └── passport-config.js      # Passport ローカル戦略およびシリアライズ設定
├── controllers/
│   ├── dashboardController.js  # ダッシュボード、最近、スター付き、検索ハンドラ
│   ├── fileController.js       # ファイル/フォルダCRUD、再帰コピー/削除、共有機能
│   ├── uploadController.js     # Multer ストレージストリームおよび Supabase アップロード
│   └── userController.js       # サインアップ、ログイン、チュートリアル、ログアウト処理
├── lib/
│   ├── prisma.js               # PostgreSQL アダプター付き Prisma クライアント初期化
│   └── supabase.js             # Supabase ストレージクライアント設定
├── middleware/
│   └── authMiddleware.js       # 認証ガードおよびルーティング保護
├── prisma/
│   ├── schema.prisma           # データベースモデル (User, Session, Folder, File, Share)
│   └── migrations/             # データベースマイグレーション履歴
├── public/
│   ├── style.css               # Google Drive にインスパイアされたカスタム CSS
│   ├── scripts/                # フロントエンドスクリプト（チュートリアル、モーダル）
│   └── gooble_drive_logo.svg   # プロジェクトロゴ・ファビコン
├── routes/
│   ├── appRouter.js            # メインアプリケーションルーター
│   ├── dashboardRouter.js      # ダッシュボード & 検索サブサブルーティング
│   └── userRouter.js           # 認証 & セッションサブサブルーティング
├── views/
│   ├── dashboard.ejs           # メインダッシュボードビュー
│   ├── homepage.ejs            # トップ / ランディングページ
│   ├── login.ejs / sign-up-form.ejs
│   └── partials/               # コンポーネントおよびモーダルのパーツ
├── app.js                      # Express アプリケーションエントリーポイント
├── package.json
└── README.ja.md
```

---

## 🚀 セットアップ & 実行手順

### 必須条件
- **Node.js**: v18.x 以上
- **PostgreSQL データベース** (例: Supabase Postgres, Neon, またはローカル PostgreSQL)
- **Supabase Storage バケット**（パブリック読み取り権限のある `uploads` という名前のバケット）

### 1. クローン & 依存関係のインストール
```bash
git clone https://github.com/your-username/gooble-drive.git
cd gooble-drive
npm install
```

### 2. 環境変数の設定
プロジェクトルートに `.env` ファイルを作成します:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/gooble_drive?schema=public"
SESSION_SECRET="your_secret_key_here"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
```

### 3. データベースマイグレーション & Prisma 生成
```bash
# Prisma クライアントの生成
npm run build

# PostgreSQL へのマイグレーション実行
npx prisma migrate deploy
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスします。

---

## 🗄️ データベーススキーマの概要

- **`User`**: 暗号化パスワードとチュートリアルフラグを持つユーザーアカウント。
- **`Folder`**: `parentId` 自己参照リレーションによる再帰的フォルダ構造。
- **`File`**: サイズ、MIMEタイプ、Supabaseバケットパス、親フォルダIDを含むファイルメタデータ。
- **`Share`**: パブリック共有用の有効期限（`expiresAt`）付き UUID 一時アクセストークン。
- **`Session`**: `@quixo3/prisma-session-store` を介して永続化される Express セッション。

---

## 📚 謝辞 & 参考資料

本プロジェクトは **[The Odin Project](https://www.theodinproject.com/)** の NodeJS カリキュラムの一環として作成されました:
- カリキュラム課題: [NodeJS File Uploader](https://www.theodinproject.com/lessons/nodejs-file-uploader)

---

## 📄 ライセンス
[ISC License](LICENSE)
