#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-8080}"
export PATH=/home/thinh/.local/bin:$PATH
export LD_LIBRARY_PATH=/home/thinh/.local/usr/lib/x86_64-linux-gnu:/home/thinh/.local/lib/x86_64-linux-gnu:/home/thinh/.local/usr/lib:$LD_LIBRARY_PATH
export GIT_EXEC_PATH=/home/thinh/.local/usr/lib/git-core

# Check MariaDB
if ! pgrep -f "mariadbd.*\.mariadb_data" > /dev/null; then
    echo "Starting MariaDB server..."
    /home/thinh/.local/bin/start-mariadb.sh &
    sleep 2
fi

echo "=================================================="
echo " Pickaball is running at:"
echo " -> Client: http://localhost:${PORT}"
echo " -> Admin:  http://localhost:${PORT}/admin"
echo "=================================================="

exec /home/thinh/.local/bin/php -S 0.0.0.0:${PORT} "$DIR/router.php"
