@echo off
setlocal
cd /d "%~dp0"

echo MoveMailbox diagnostic mode
echo Keep this window open while testing.
echo.

"%~dp0movemailbox.exe" --demo --open=true

echo.
echo Process finished with exit code %errorlevel%.
echo Diagnostic log: movemailbox.log
pause
