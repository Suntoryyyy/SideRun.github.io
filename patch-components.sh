# Refactor all files reading from currentUser via AsyncStorage to use userStore

export LC_ALL=C

for file in "screens/RunScreen.js" "screens/FriendsScreen.js" "screens/ProfileScreen.js" "screens/HomeScreen.js" "hooks/useRunTracking.js"; do
  if [ -f "$file" ]; then
    echo "Refactoring $file"
    # Inject the store import
    if ! grep -q "useUserStore" "$file"; then
      if [[ "$file" == hooks/* ]]; then
        sed -i '' "s|import AsyncStorage|import useUserStore from '../store/useUserStore';\nimport AsyncStorage|g" "$file"
      else
        sed -i '' "s|import AsyncStorage|import useUserStore from '../store/useUserStore';\nimport AsyncStorage|g" "$file"
      fi
    fi
  else
    echo "Files not found: $file"
  fi
done

