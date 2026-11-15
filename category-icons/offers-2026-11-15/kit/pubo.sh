set -e; W5=$(cd "$(dirname "$0")/.." && pwd); w=$1; d=$W5/offers-1115/$w
cd "$d" && COPYFILE_DISABLE=1 tar -cf - offers.json img | ssh rasid-vps "docker exec infra-api-1 sh -c 'rm -rf /tmp/o/$w; mkdir -p /tmp/o/$w' && docker exec -i infra-api-1 tar -xf - -C /tmp/o/$w 2>/dev/null"
cat "$W5/kit/prepend.js" | ssh rasid-vps "docker exec -i infra-api-1 sh -c 'cat > /app/x_prep.js'"
cat "$W5/kit/publish.js" | ssh rasid-vps "docker exec -i infra-api-1 sh -c 'cat > /app/x_pub.js' && docker exec -w /app infra-api-1 sh -c 'node x_prep.js /tmp/o/$w $w && node x_pub.js /tmp/o/$w; rm -f x_pub.js x_prep.js'"
