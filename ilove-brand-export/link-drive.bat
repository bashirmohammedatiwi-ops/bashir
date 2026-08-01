@echo off
chcp 65001 >nul
cd /d "%~dp0..\backend"
echo.
echo  ربط Excel بروابط Google Drive...
echo.
npx tsx scripts/link-ilove-drive-excel.ts %*
echo.
pause
