#!/bin/bash
echo ""
echo "======================================="
echo "  SmartFitCoach - Dev Server"
echo "  → http://localhost:3000"
echo "  Ctrl+C pour arrêter"
echo "======================================="
echo ""
npx live-server app --port=3000 --host=0.0.0.0 --no-browser --entry-file=index.html
