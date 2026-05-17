#!/bin/bash
# SmartFitCoach — Auto-batch generation : attend le reset quota et génère par tranches de 99.
# Lance une fois, gère les 4 jours de génération automatiquement.
cd /home/user/Smartfitcoach

# Charger la clé API
export YOUTUBE_API_KEY=$(grep '^YOUTUBE_API_KEY=' .env 2>/dev/null | cut -d= -f2)
if [ -z "$YOUTUBE_API_KEY" ]; then echo "ERR: YOUTUBE_API_KEY absent de .env"; exit 1; fi

LOG="registry-auto-$(date +%Y%m%d-%H%M).log"
echo "=== AUTO BATCH START $(date -u) ===" | tee "$LOG"

# check_quota_for_search : vérifie qu'on a assez de quota pour search.list (100 unités)
# Utilise search.list avec maxResults=1 (100 unités) — si 403 = quota épuisé
check_quota() {
  node -e "
    var https=require('https'),fs=require('fs');
    fs.readFileSync('.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.+)\$/);if(m)process.env[m[1]]=m[2].trim();});
    https.get('https://www.googleapis.com/youtube/v3/search?part=id&q=bench+press&type=video&maxResults=1&channelId=UCe0TLA0EsQbE-MjuHXevj2A&key='+process.env.YOUTUBE_API_KEY,function(r){
      var d='';r.on('data',function(c){d+=c;});r.on('end',function(){
        try{var p=JSON.parse(d);if(p.error&&p.error.code===403)process.exit(1);else process.exit(0);}catch(e){process.exit(1);}
      });
    }).on('error',function(){process.exit(1);});
  " 2>/dev/null
  return $?
}

# wait_for_quota : poll toutes les 15min jusqu'à ce que le quota soit OK
wait_for_quota() {
  local MAX_WAIT=90000  # 25h max
  local WAITED=0
  while ! check_quota; do
    echo "$(date -u) Quota search epuise — retry dans 15min" | tee -a "$LOG"
    sleep 900
    WAITED=$((WAITED+900))
    if [ $WAITED -gt $MAX_WAIT ]; then
      echo "$(date -u) TIMEOUT 25h — abandon" | tee -a "$LOG"
      exit 1
    fi
  done
  echo "$(date -u) Quota disponible" | tee -a "$LOG"
}

# run_batch : lance un batch, attend quota si nécessaire
run_batch() {
  local NUM=$1
  local OFFSET=$2
  local OUTPUT="registry-batch${NUM}.json"

  echo "" | tee -a "$LOG"
  echo "=== BATCH $NUM (offset=$OFFSET) START $(date -u) ===" | tee -a "$LOG"

  wait_for_quota

  node scripts/generate-video-registry.js \
    --muscu \
    --offset=$OFFSET \
    --limit=99 \
    --threshold=60 \
    --output="$OUTPUT" \
    --checkpoint="registry-checkpoint-muscu.json" \
    --resume \
    2>&1 | tee -a "$LOG"

  local STATUS=$?
  if [ $STATUS -eq 2 ]; then
    echo "$(date -u) Quota epuise en cours de batch — attente reset puis reprise" | tee -a "$LOG"
    wait_for_quota
    # Reprendre là où on s'est arrêté (--resume lit le checkpoint)
    node scripts/generate-video-registry.js \
      --muscu \
      --offset=$OFFSET \
      --limit=99 \
      --threshold=60 \
      --output="$OUTPUT" \
      --checkpoint="registry-checkpoint-muscu.json" \
      --resume \
      2>&1 | tee -a "$LOG"
  fi

  echo "=== BATCH $NUM DONE $(date -u) — fichier: $OUTPUT ===" | tee -a "$LOG"
}

# 4 batches pour couvrir ~335 exercices restants (skip déjà bons)
run_batch 1 0
run_batch 2 99
run_batch 3 198
run_batch 4 297

echo "" | tee -a "$LOG"
echo "=== GENERATION COMPLETE $(date -u) ===" | tee -a "$LOG"
echo "Fichiers generés: registry-batch1.json registry-batch2.json registry-batch3.json registry-batch4.json" | tee -a "$LOG"
echo ""
echo "Etapes suivantes:"
echo "  1. node scripts/merge-registry-batches.js  (fusionner les 4 fichiers)"
echo "  2. Copier le snippet JS dans app/exercise-videos.js"
echo "  3. node scripts/validate-video-registry.js --dry-run  (vérifier)"
echo "  4. bash scripts/build-bundle.sh  (rebuild bundle)"
echo "  5. git add app/exercise-videos.js app/bundle.js && git commit"
