const fs = require('fs');
let code = fs.readFileSync('screens/ProfileScreen.js', 'utf8');

const fallbackBlock = `
        if (error) {
          if (error.message.includes("does not exist")) {
            // Fallback for missing columns in Supabase
            const { error: fallbackError } = await supabase
              .from("users")
              .update({ username, avatar })
              .eq("id", updatedUser.id);
            
            if (fallbackError) {
              showAlert("Cloud Sync Error", fallbackError.message);
              return;
            } else {
              showAlert("Partial Success", "Profile saved, but privacy settings require Supabase database columns 'allowFriendsViewRecord' and 'allowStrangersAdd' to be added.", "info");
              setCurrentUser(updatedUser);
              setIsEditing(false);
              return;
            }
          }
          console.error("Supabase Save Error:", error);
          showAlert("Cloud Sync Error", error.message);
          return;
        }
`;

code = code.replace(/        if \(error\) \{\n          console\.error\("Supabase Save Error:", error\);\n          showAlert\("Cloud Sync Error", error\.message\);\n          return; \/\/ Stop local save if cloud fails\n        \}/, fallbackBlock.trim());

fs.writeFileSync('screens/ProfileScreen.js', code);
