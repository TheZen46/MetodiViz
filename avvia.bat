@echo off
cd /d "%~dp0"
if not exist "node_modules" (
  echo Installazione dipendenze al primo avvio...
  call npm install
)
echo Avvio MetodiViz nel browser...
call npm run dev -- --open
