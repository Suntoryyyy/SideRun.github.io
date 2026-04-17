const fs = require('fs');
let code = fs.readFileSync('screens/FriendsScreen.js', 'utf8');

const scrollRegex = /<ScrollView\s+style=\{styles\.content\}\s+showsVerticalScrollIndicator=\{false\}\s*>\n([\s\S]*?)<\/ScrollView>/m;

code = code.replace(scrollRegex, (match, content) => {
  return `<FlatList
          style={styles.content}
          keyExtractor={(item) => item.id || Math.random().toString()}
          data={[1]}
          renderItem={() => (
            <>
              ${content}
            </>
          )}
          showsVerticalScrollIndicator={false}
        />`;
});

code = code.replace("import {\n  View,\n  Text,", "import {\n  FlatList,\n  View,\n  Text,");

fs.writeFileSync('screens/FriendsScreen.js', code);
