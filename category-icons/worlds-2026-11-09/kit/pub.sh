#!/bin/bash
# pub.sh <world>: ship img/ + plan.json to the api container and run publish.js
set -e; W5=$(cd "$(dirname "$0")/.." && pwd); w=$1
cd "$W5/$w" && du -sh img | cut -f1
COPYFILE_DISABLE=1 tar -cf - plan.json img | ssh rasid-vps "docker exec infra-api-1 sh -c 'rm -rf /tmp/w5/$w; mkdir -p /tmp/w5/$w' && docker exec -i infra-api-1 tar -xf - -C /tmp/w5/$w 2>/dev/null"
cat "$W5/kit/publish.js" | ssh rasid-vps "docker exec -i infra-api-1 sh -c 'cat > /app/x_pub.js' && docker exec -w /app infra-api-1 sh -c 'node x_pub.js /tmp/w5/$w; rm -f x_pub.js'"
