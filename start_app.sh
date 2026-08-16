#!/bin/bash
echo "========================================================"
echo "  SynLeaderboard - マリオカート 交流戦成績ダッシュボード"
echo "========================================================"
echo ""
echo "ブラウザでアプリを開いています..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "index.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "index.html" 2>/dev/null || sensible-browser "index.html"
else
    open "index.html"
fi

echo "起動が完了しました！"
