@echo off
title ArcGIS Experience Builder - DEV

REM === Configurar PATH para Node y Chrome (si ya está en PATH, no afecta) ===
set PATH=%PATH%;"C:\Program Files\Google\Chrome\Application"

REM === Iniciar SERVER ===
echo Iniciando Experience Builder SERVER...
start "EXB SERVER" cmd /k ^
cd /d "E:\IGAC\Software\arcgis-experience-builder-1.19\server" ^&^& npm start

REM === Espera breve para asegurar que el server levante ===
timeout /t 10 /nobreak > nul

REM === Iniciar CLIENT ===
echo Iniciando Experience Builder CLIENT...
start "EXB CLIENT" cmd /k ^
cd /d "E:\IGAC\Software\arcgis-experience-builder-1.19\client" ^&^& npm start

REM === Espera para que el client levante el puerto 3001 ===
timeout /t 15 /nobreak > nul

REM === Lanzar Chrome con flags necesarios ===
echo Abriendo Chrome...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
 --user-data-dir="E:\IGAC\Software\arcgis-experience-builder-1.19\client" ^
 --ignore-certificate-errors ^
 --allow-insecure-localhost ^
 --disable-web-security ^
 --disable-site-isolation-trials ^
 https://localhost:3001/

echo Entorno Experience Builder iniciado correctamente.
exit
