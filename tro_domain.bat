@echo off
:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
    echo Dang yeu cau quyen Administrator de chinh file hosts...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"=""
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------

echo ========================================================
echo DANG TRO DOMAIN picko247.com VE IP 103.15.222.22...
echo ========================================================

findstr /C:"picko247.com" "%WINDIR%\system32\drivers\etc\hosts" >nul
if %errorlevel% equ 0 (
    echo Domain picko247.com da ton tai trong file hosts.
) else (
    echo. >> "%WINDIR%\system32\drivers\etc\hosts"
    echo 103.15.222.22 picko247.com www.picko247.com >> "%WINDIR%\system32\drivers\etc\hosts"
    echo Da them thanh cong vao file hosts!
)

ipconfig /flushdns
echo ========================================================
echo HOAN TAT! Ban co the mo trinh duyet vao: http://picko247.com
echo ========================================================
pause
