@echo off
setlocal
cd /d "%~dp0"
title Dragon Fury - Godot 4.7 (Vulkan Forward+)

echo ========================================================
echo        DRAGON FURY - MOTOR NATIVO GODOT 4.7
echo ========================================================
echo Levantando juego...
echo.

set "GODOT_EXE=C:\Users\rcarm\Downloads\Godot_v4.7.2-stable_win64.exe\Godot_v4.7.2-stable_win64.exe"

if not exist "%GODOT_EXE%" (
    echo [ERROR] No se encontro el ejecutable de Godot en:
    echo %GODOT_EXE%
    pause
    exit /b 1
)

start "" "%GODOT_EXE%" .

exit /b 0
