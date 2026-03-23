#!/bin/bash
# SmartFitCoach - Serveur de développement local
# Lance un serveur avec live-reload sur http://localhost:3000

echo "======================================="
echo "  SmartFitCoach - Dev Server"
echo "  URL: http://localhost:3000"
echo "  Live-reload activé"
echo "  Ctrl+C pour arrêter"
echo "======================================="

npx live-server "macro-calculator-pro (1)" \
  --port=3000 \
  --host=localhost \
  --open=/index.html \
  --watch="macro-calculator-pro (1)" \
  --ignore="*.log" \
  --no-css-inject \
  --entry-file=index.html
