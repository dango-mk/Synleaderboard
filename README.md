# 🏆 SynLeaderboard - MK8D 6v6 Match Analytics & Dashboard

[![GitHub Pages Deployment](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?logo=github)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

マリオカート8 デラックスの 6v6 交流戦ログ（Discordボットの勝敗テキスト・CSV）を自動解析し、**全戦績・勝率・点数差推移グラフ・カレンダー・年/月別エクスプローラー**を視覚的に可視化するWebアプリケーションです。

---

## ✨ 主な機能

1. **⚡ 一瞬で全ログ自動統合解析**:
   - 2021年〜2026年の数千試合に及ぶログデータを起動時（0.01秒）に全自動統合パース。
   - 984pt成立チェック（0:0のテスト試合や未完成試合の除外フィルタリング）。

2. **📅 インタラクティブ試合カレンダー**:
   - 日付ごとの勝敗結果・対戦数を色分け表示（`3戦` `勝利/敗北`）。
   - 「1年戻る/進む（`«` `»`）」ボタン & 「🔍 拡大」全画面ビュー。

3. **📂 2段階ネスト 戦績エクスプローラー**:
   - `年フォルダ (📂 2026年)` ➔ `月フォルダ (📁 08月)` ➔ `試合ファイル (📄 16日 vs Aqua)` の階層構造。
   - 「最新順」「古い順」切り替え & 「📂 全展開」「📁 全収納」ボタン。

4. **📈 レース別点数差推移グラフ (Chart.js)**:
   - 12レースのリード点数推移を線グラフで描画。レース別順位（1〜12着）ブレイクダウン。

5. **☁️ ワンクリック クラウド共有 & 超短縮URL**:
   - ボタン1つで無料クラウドAPI（`npoint.io` / `jsonbin.io`）へデータ保存し、短縮URL（`#n=ID`）を発行。
   - 相手にURLを送るだけで、ファイル不要で全ダッシュボードが一発表示。

---

## 🚀 GitHubでの共有・公開手順

### 1. GitHubリポジトリを作成してコードを送信する手順

ターミナルまたは PowerShell で以下のコマンドを実行して GitHub に Push します：

```bash
# 1. ローカルリポジトリの初期化
git init
git add .
git commit -m "Initial commit of SynLeaderboard"

# 2. GitHubリポジトリへの紐付け (REPOSITORY_URLを自分のGitHubリポジトリに変更)
git branch -M main
git remote add origin https://github.com/USERNAME/syn-leaderboard.git

# 3. データの送信
git push -u origin main
```

---

### 2. GitHub Pages でWebサイトとして無料公開する手順

本リポジトリには `.github/workflows/deploy.yml` が同梱されているため、GitHub Pages のデプロイが全自動化されています：

1. GitHub リポジトリの **Settings** ページを開きます。
2. 左メニューの **Pages** を選択します。
3. **Build and deployment** の Source を **`GitHub Actions`** に変更します。
4. `git push` が完了すると自動的にビルドが走り、数秒後に `https://<USERNAME>.github.io/syn-leaderboard/` で世界中に公開されます！

---

## 💻 ローカル環境での起動方法

サーバーのインストールや複雑な設定は一切不要です！

### Windows の場合:
フォルダ内の **`start_app.bat`** をダブルクリックするだけで、お使いのブラウザでアプリが即座に起動します。

### Mac / Linux の場合:
ターミナルで以下を実行します：
```bash
chmod +x start_app.sh
./start_app.sh
```

---

## 📂 プロジェクト構成

```text
syn_leaderboard/
├── index.html                # メインダッシュボードHTML
├── styles.css                # バニラCSSデザインシステム
├── start_app.bat             # Windows用ワンクリック起動バッチ
├── start_app.sh              # Mac/Linux用ワンクリック起動スクリプト
├── package.json              # プロジェクト設定ファイル
├── .gitignore                # Git除外設定
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages 自動公開ワークフロー
├── js/
│   ├── data_bundle.js        # 全統合データバンドル (10.1MB)
│   ├── parser.js             # MK8D Bot & CSV解析エンジン
│   ├── calendar.js           # カレンダー & 2階層戦績エクスプローラー
│   ├── chart.js              # Chart.js 推移グラフ描画
│   ├── analytics.js          # 成績・KPI集計エンジン
│   ├── levenshtein.js        # 対戦相手チーム検索補完
│   └── app.js                # メインコントローラー
└── data/                     # 原本Discordログデータ群 (.txt)
```

---

## 📄 ライセンス

MIT License
