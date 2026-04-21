# TaskFlow

個人用タスク管理アプリ（Vite + React）

## Vercel へのデプロイ手順

### 1. GitHubにリポジトリを作成してpush

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/taskflow.git
git push -u origin main
```

### 2. Vercel にインポート

1. https://vercel.com にログイン
2. 「Add New → Project」
3. 上記のGitHubリポジトリを選択
4. Framework: **Vite** が自動検出されます
5. そのまま「Deploy」をクリック

完了後、自動で公開URLが発行されます。

---

## ローカルで動かす場合

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

---

## Anthropic API キーについて

AIサブタスク分解機能を使う場合、サイドバー下部に API キーを入力してください。
APIキーは **ブラウザの localStorage に保存** されます（他者に共有されません）。

APIキーの取得: https://console.anthropic.com/

---

## データの保存先

すべてのタスク・メモ・設定はブラウザの **localStorage** に保存されます。
ブラウザのデータを削除すると消えるのでご注意ください。
