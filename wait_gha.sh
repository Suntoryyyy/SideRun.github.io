while true; do
  STATUS=$(curl -s "https://api.github.com/repos/Suntoryyyy/SideRun.github.io/actions/runs?per_page=1" | grep '"status": "completed"')
  if [ -n "$STATUS" ]; then
    echo "Ready!"
    break
  fi
  sleep 5
done
