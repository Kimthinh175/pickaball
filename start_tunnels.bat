@echo off
echo Dang khoi dong Localtunnel va Cloudflared...

start "Localtunnel" cmd /k "npx -y localtunnel --port 80"
start "Cloudflared" cmd /k "cloudflared.exe tunnel --url http://localhost:80"

echo Da mo 2 cua so chay tunnel.
pause
