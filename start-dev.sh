#!/bin/bash
# SmartFitCoach - Serveur de développement local

echo ""
echo "======================================="
echo "  SmartFitCoach - Dev Server"
echo "  → http://localhost:3000"
echo "  Live-reload activé (auto-refresh)"
echo "  Ctrl+C pour arrêter"
echo "======================================="
echo ""

npx live-server "macro-calculator-pro (1)" \
  --port=3000 \
  --host=0.0.0.0 \
  --no-browser \
  --entry-file=index.html
