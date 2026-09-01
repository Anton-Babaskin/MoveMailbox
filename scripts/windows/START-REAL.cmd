@echo off
setlocal
cd /d "%~dp0"

echo.
echo  MoveMailbox - real migration mode
echo  ---------------------------------
echo  This mode requires imapsync in PATH or next to the application.
echo  Test both connections before starting a migration.
echo.

"%~dp0movemailbox.exe" --open=true

if errorlevel 1 (
  echo.
  echo  MoveMailbox could not start.
  echo  Open movemailbox.log and send us its last lines.
  echo.
  pause
)
