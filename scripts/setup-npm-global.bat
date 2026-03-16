@echo off
REM Cross-platform npm global prefix setup script for Windows
REM Works on any Windows version, automatically uses current user

REM Set npm global prefix to user home directory (automatic)
npm config set prefix "%USERPROFILE%" --global

echo =========================================
echo npm Global Configuration
echo =========================================
echo Username: %USERNAME%
echo Home directory: %USERPROFILE%
echo.
echo npm global prefix set to: %USERPROFILE%
echo Global packages will be installed to: %USERPROFILE%\node_modules
echo Global binaries will be in: %USERPROFILE%\bin
echo.
echo You may need to add %USERPROFILE%\bin to your PATH
echo =========================================

REM Show current npm prefix
npm config get prefix --global
