for file in screens/FriendsScreen.js screens/ProfileScreen.js screens/RunHistoryScreen.js components/ActivityFeed.js components/Leaderboard.js; do
  if [ -f "$file" ]; then
    # Remove Image from react-native imports
    sed -i '' 's/ Image,//g' "$file"
    sed -i '' 's/, Image//g' "$file"
    
    # Check if expo-image is already imported
    if ! grep -q "from 'expo-image'" "$file"; then
      # Insert after first import block
      awk '/import / && !x {print; print "import { Image } from '"'expo-image'"';"; x=1; next} 1' "$file" > tmp && mv tmp "$file"
    fi
  fi
done
