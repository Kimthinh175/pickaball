#!/bin/bash
PORT="${1:-8080}"
export PATH=/home/thinh/.local/bin:$PATH
echo "Đang khởi tạo Cloudflare Tunnel cho port $PORT..."
cloudflared tunnel --url "http://localhost:$PORT"
