@echo off
title Fabrica de Contenido v5.0 Server
echo.
echo =======================================================
echo   INICIANDO SERVIDOR DE DESARROLLO (VITE)...
echo =======================================================
echo.
echo   Por favor, espera a que aparezca el mensaje:
echo   "VITE v... ready in ..."
echo.
echo   Este proceso se quedara activo.
echo   Para detener el servidor, cierra esta ventana.
echo.

:: Navega al directorio correcto
cd /d "D:\app6"

:: Inicia el servidor. El comando "start" hace que se ejecute en una nueva ventana.
:: Esto permite que el script continue al siguiente paso.
start "Vite Server" npm run dev

:: Espera unos segundos para dar tiempo al servidor a arrancar
timeout /t 5 > nul

:: Ahora si, abre el navegador
start http://localhost:5173

exit