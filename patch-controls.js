const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf8');

const newControls = `
        <View style={styles.controlsContainer}>
          {mode === "spectate" ? (
            <View style={{flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 20}}>
              <TouchableOpacity onPress={() => sendCheer("🔥")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>🔥</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("👏")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>👏</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("🚀")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sendCheer("💦")} style={{backgroundColor: "#F0F0F0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center"}}>
                <Text style={{fontSize: 28}}>💦</Text>
              </TouchableOpacity>
            </View>
          ) : isFinished ? (
`;

code = code.replace(/        <View style=\{styles\.controlsContainer\}>\n          \{isFinished \? \(/, newControls.trim());
fs.writeFileSync('screens/RunScreen.js', code);
