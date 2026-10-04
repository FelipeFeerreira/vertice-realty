@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo =========================================
echo   Vertice Realty - Starting the development server
echo =========================================
echo.

if not exist ".env" copy ".env.example" ".env" >nul

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

call npx prisma generate
if errorlevel 1 exit /b 1

if not exist "prisma\dev.db" (
  echo Setting up the demo database...
  call npx prisma db push
  if errorlevel 1 exit /b 1
  call npx prisma db seed
  if errorlevel 1 exit /b 1
)

echo.
echo Starting the development server...
echo Website: http://localhost:3000
echo Dashboard: http://localhost:3000/dashboard
echo.

npx next dev

pause
