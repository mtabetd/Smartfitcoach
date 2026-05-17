#!/bin/bash
# SmartFitCoach — Génération batch automatique du registre vidéo
# Lance les batches quand le quota YouTube API est disponible.
# Usage: bash scripts/run-batch-generation.sh

set -e
cd "$(dirname "$0")/.."

# Charger la clé API depuis .env
if [ -f .env ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env | xargs)
fi

if [ -z "$YOUTUBE_API_KEY" ]; then
  echo "ERR: YOUTUBE_API_KEY non défini dans .env"
  exit 1
fi

LOG="registry-generation-$(date +%Y%m%d).log"
echo "=== GÉNÉRATION DÉMARRÉE $(date) ===" | tee -a "$LOG"

# Batch muscu — 99 exercices par jour (limite quota 10K unités)
BATCH=99

for i in 0 99 198 297; do
  echo ""
  echo "--- Batch offset=$i limit=$BATCH ---" | tee -a "$LOG"
  
  # Tester si quota disponible
  QUOTA_CHECK=$(node -e "
    var https=require('https'), fs=require('fs'), path=require('path');
    fs.readFileSync('.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.+)$/);if(m)process.env[m[1]]=m[2].trim();});
    https.get('https://www.googleapis.com/youtube/v3/videos?part=id&id=jNQXAC9IVRw&key='+process.env.YOUTUBE_API_KEY, function(r){
      var d=''; r.on('data',function(c){d+=c;}); r.on('end',function(){
        var p=JSON.parse(d);
        if(p.error&&p.error.code===403) process.exit(1);
        else process.exit(0);
      });
    }).on('error',function(){process.exit(1)});
  " 2>/dev/null; echo $?)
  
  if [ "$QUOTA_CHECK" != "0" ]; then
    echo "QUOTA EPUISE — attente reset (00:00 PDT = 07:00 UTC)" | tee -a "$LOG"
    # Attendre jusqu'au prochain minuit PDT
    SECS_TO_RESET=$(TZ='America/Los_Angeles' date -d "tomorrow 00:00" +%s 2>/dev/null || echo 82800)
    NOW=$(date +%s)
    WAIT=$((SECS_TO_RESET - NOW + 300))  # +5min buffer
    [ $WAIT -lt 0 ] && WAIT=300
    echo "Attente $WAIT secondes..." | tee -a "$LOG"
    sleep $WAIT
  fi
  
  node scripts/generate-video-registry.js \
    --muscu \
    --offset=$i \
    --limit=$BATCH \
    --threshold=60 \
    --output="registry-batch-$i.json" \
    --checkpoint="registry-checkpoint-muscu.json" \
    --verbose \
    2>&1 | tee -a "$LOG"
  
  STATUS=$?
  if [ $STATUS -eq 2 ]; then
    echo "Quota épuisé pendant le batch $i — reprendre demain avec --resume" | tee -a "$LOG"
    break
  fi
  
  echo "Batch $i terminé — intégration dans exercise-videos.js..." | tee -a "$LOG"
  
  # Attendre reset quota pour le prochain batch (si pas le dernier)
  if [ $i -lt 297 ]; then
    echo "Pause 24h avant le prochain batch..." | tee -a "$LOG"
    sleep 86400
  fi
done

echo ""
echo "=== GÉNÉRATION TERMINÉE $(date) ===" | tee -a "$LOG"
echo "Fichiers générés : registry-batch-*.json"
echo "Intégrer manuellement dans exercise-videos.js avec les snippets générés."
