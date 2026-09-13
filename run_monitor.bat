@echo off
chcp 65001 >nul
title Мониторинг фискальных служб (FiscalService)

echo ===============================================================================
echo   СИСТЕМА МОНИТОРИНГА КАССОВЫХ ФИСКАЛЬНЫХ СЛУЖБ (FiscalService / DriveAPI)
echo ===============================================================================
echo.
echo   [1] Полный опрос всех касс (диапазон 114..222, хосты 201..205)
echo   [2] Показать только кассы с РАБОТАЮЩИМ FiscalService (--only-running)
echo   [3] Показать кассы со ОСТАНОВЛЕННЫМ FiscalService (--only-stopped)
echo   [4] Запустить ЖИВОЙ МОНИТОРИНГ каждые 30 секунд (--watch 30)
echo   [5] Запустить ВЕБ-ДАШБОРД в браузере (http://localhost:8088)
echo   [6] Опрос касс из файла ips.txt
echo   [7] Выход
echo.
set /p choice="Выберите режим [1-7]: "

if "%choice%"=="1" (
    python fiscal_monitor.py --subnets 114-222
) else if "%choice%"=="2" (
    python fiscal_monitor.py --subnets 114-222 --only-running
) else if "%choice%"=="3" (
    python fiscal_monitor.py --subnets 114-222 --only-stopped
) else if "%choice%"=="4" (
    python fiscal_monitor.py --subnets 114-222 --watch 30
) else if "%choice%"=="5" (
    start http://localhost:8088/
    python fiscal_monitor.py --subnets 114-222 --web 8088
) else if "%choice%"=="6" (
    python fiscal_monitor.py --file ips.txt
) else (
    echo Выход...
    exit /b 0
)

echo.
pause
