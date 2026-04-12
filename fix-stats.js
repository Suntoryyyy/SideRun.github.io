const fs = require('fs');
let code = fs.readFileSync('screens/RunScreen.js', 'utf-8');

const oldBlock = `        {!isPanelCollapsed && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{runData.distance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>KILOMETERS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>
            </View>
            
            <View style={[styles.statsRow, { marginTop: 24 }]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{currentPace}</Text>
                <Text style={styles.statLabel}>CURRENT PACE</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.round(runData.calories)}</Text>
                <Text style={styles.statLabel}>KCAL BURNED</Text>
              </View>
            </View>

            {mode === 'shared' && (
              <Text style={styles.friendsText}>👥 {friendsWatching} friends watching</Text>
            )}
          </View>
        )}`;

const newBlock = `        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{runData.distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>KILOMETERS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentPace}</Text>
              <Text style={styles.statLabel}>PACE(M/KM)</Text>
            </View>
          </View>
          
          <Animated.View style={[styles.statsRow, { marginTop: 24, opacity: contentOpacity }]}>
            <View style={{flex:1}} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(runData.calories)}</Text>
              <Text style={styles.statLabel}>KCAL BURNED</Text>
            </View>
            <View style={{flex:1}}>
              {mode === 'shared' && (
                <Text style={styles.friendsText}>👥 {friendsWatching} friends</Text>
              )}
            </View>
          </Animated.View>
        </View>`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('screens/RunScreen.js', code);
