@echo off
title Terminal de Avaliacao Euroinvest - Mini Indice WIN
cd /d "%~dp0"
echo ========================================================
echo   EUROINVEST - TERMINAL DE AVALIACAO (PLANO JUNIOR)
echo ========================================================
echo.
echo Iniciando servidor local e abrindo navegador...
echo Endereco: http://localhost:3000/web/
echo.
start "" "http://localhost:3000/web/"
node server.mjs
pause
