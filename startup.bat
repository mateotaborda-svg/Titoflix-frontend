@echo off
setlocal

REM Levanta backend + frontend para desarrollo en Windows.
REM Usuario default creado automaticamente por el backend:
REM   email: pati@titoflix.local
REM   password: 12345678

echo [1/2] Iniciando backend (http://127.0.0.1:8000)...
start "Titoflix Backend" cmd /k "cd /d %~dp0backend && if exist ..\venv\Scripts\activate.bat (call ..\venv\Scripts\activate.bat) && uvicorn src.main:app --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando frontend (http://127.0.0.1:3000)...
start "Titoflix Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Listo. Proba login con:
echo   Email: pati@titoflix.local
echo   Password: 12345678

endlocal
