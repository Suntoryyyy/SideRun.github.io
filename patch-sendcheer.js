const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const regex = /  const sendCheer = \(specificEmoji = null\) => {([\s\S]*?)};\n/m;

const replacement = `
  const sendCheer = async (specificEmoji = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const emojis = ["💪", "🔥", "🏃‍♂️", "🎉", "👍", "⚡️", "🚀"];
    const emojiToUse = specificEmoji || emojis[Math.floor(Math.random() * emojis.length)];
    
    // Render locally for instant feedback
    const cheerId = Date.now().toString() + Math.random();
    setLiveEmojis((prev) => {
      const limited = prev.length > 15 ? prev.slice(-14) : prev;
      return [...limited, { id: cheerId, emoji: emojiToUse }];
    });

    if (mode === "spectate" && spectateFriend) {
      let myId = "Unknown";
      try {
        const c = await AsyncStorage.getItem("currentUser");
        if (c) {
          const cu = JSON.parse(c);
          myId = cu.id || cu.phone || cu.username;
        }
      } catch (e) {}

      // Only mock insertion, or try but don't crash
      const { error } = await supabase.from("live_cheers").insert([
        {
          sender_id: myId,
          receiver_id: spectateFriend.id || spectateFriend.phone || spectateFriend.name,
          emoji: emojiToUse,
          message: "Keep going!",
        },
      ]);
      if (error) console.warn("Mock cheer sent:", error);
    }
  };
`;

code = code.replace(regex, replacement);
fs.writeFileSync('screens/RunScreen.js', code);
