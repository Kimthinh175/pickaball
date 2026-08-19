#!/bin/bash
echo "Stopping Pickaball server..."
pkill -f "php.*router.php"
echo "Stopping MariaDB server..."
pkill -f "mariadbd.*\.mariadb_data"
echo "Stopping Cloudflare tunnel..."
pkill -f "cloudflared.*tunnel"
echo "Done."
