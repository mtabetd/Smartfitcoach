#!/bin/bash
cd /home/user/Smartfitcoach
source .env 2>/dev/null || export YOUTUBE_API_KEY=$(grep YOUTUBE_API_KEY .env | cut -d= -f2)
LOG="registry-auto-$(date +%Y%m%d-%H%M).log"

check_quota() {
  node -e "
    var https=require('https'),fs=require('fs');
    fs.readFileSync('.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.+)\$/);if(m)process.env[m[1]]=m[2].trim();});
    https.get('https://www.googleapis.com/youtube/v3/videos?part=id&id=jNQXAC9IVRw&key='+process.env.YOUTUBE_API_KEY,function(r){
      var d='';r.on('data',function(c){d+=c;});r.on('end',function(){
        try{var p=JSON.parse(d);if(p.error&&p.error.code===403)process.exit(1);else process.exit(0);}catch(e){process.exit(1);}
      });
    }).on('error',function(){process.exit(1);});
  " 2>/dev/null
  return $?
}

echo "=== AUTO BATCH START $(date -u) ===" | tee "$LOG"

# Attendre que le quota soit disponible (check toutes les 15min)
MAX_WAIT=86400
WAITED=0
while ! check_quota; do
  echo "$(date -u) Quota épuisé — retry dans 15min" | tee -a "$LOG"
  sleep 900
  WAITED=$((WAITED+900))
  if [ $WAITED -gt $MAX_WAIT ]; then echo "Timeout 24h" | tee -a "$LOG"; exit 1; fi
done

echo "$(date -u) Quota disponible — lancement batch muscu" | tee -a "$LOG"

# Batch 1 : exercices 0-98 (skip already good)
node scripts/generate-video-registry.js \
  --muscu --limit=99 --threshold=60 \
  --output=registry-batch1.json \
  --checkpoint=registry-checkpoint-muscu.json \
  2>&1 | tee -a "$LOG"

echo "=== BATCH 1 DONE $(date -u) ===" | tee -a "$LOG"
echo "Fichier: registry-batch1.json" | tee -a "$LOG"
