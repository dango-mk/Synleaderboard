@echo off
chcp 65001 > nul
title SynLeaderboard - 起動中...
echo ========================================================
echo   SynLeaderboard - マリオカート 交流戦成績ダッシュボード
echo ========================================================
echo.
echo ブラウザでアプリを開いています...
start "" "%~dp0index.html"
echo 起動が完了しました！このウィンドウは閉じて構いません。
timeout /t 3 > nul
exit
