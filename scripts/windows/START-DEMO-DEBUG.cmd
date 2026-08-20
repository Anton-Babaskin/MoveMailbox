@echo off
setlocal
cd /d "%~dp0"

echo Mailbox Migrator diagnostic mode
echo Keep this window open while testing.
echo.

"%~dp0mailbox-migrator.exe" --demo --open=true

echo.
echo Process finished with exit code %errorlevel%.
echo Diagnostic log: mailbox-migrator.log
pause
