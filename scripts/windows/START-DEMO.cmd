@echo off
setlocal
cd /d "%~dp0"

echo.
echo  MoveMailbox Preview
echo  ------------------------
echo  Starting safe demo mode. No real mail servers will be contacted.
echo.

"%~dp0movemailbox.exe" --demo --open=true

if errorlevel 1 (
  echo.
  echo  MoveMailbox could not start.
  echo  Open movemailbox.log and send us its last lines.
  echo.
  pause
)
