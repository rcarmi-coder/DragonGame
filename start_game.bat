@echo off
title Dragon Fury - Lanzador de Juego
echo ========================================================
echo               DRAGON FURY - FURIA ANCESTRAL
echo ========================================================
echo Iniciando servidor local y abriendo el juego en tu navegador...
echo.
echo Conecta tu mando de PlayStation (DualShock / DualSense) o usa
echo Teclado + Raton para dominar los cielos.
echo.
echo Presiona Ctrl+C en esta ventana cuando desees cerrar el juego.
echo ========================================================

start http://localhost:8080
python -m http.server 8080
