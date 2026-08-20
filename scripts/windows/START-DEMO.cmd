@echo off
setlocal
cd /d "%~dp0"

echo.
echo  Mailbox Migrator Preview
echo  ------------------------
echo  Starting safe demo mode. No real mail servers will be contacted.
echo.

"%~dp0mailbox-migrator.exe" --demo --open=true

if errorlevel 1 (
  echo.
  echo  Mailbox Migrator could not start.
  echo  Open mailbox-migrator.log and send us its last lines.
  echo.
  pause
)
