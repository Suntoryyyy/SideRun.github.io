const fs = require('fs');

let code = fs.readFileSync('screens/HomeScreen.js', 'utf8');

// Replace colors in render area
code = code.replace(/color="#222222"/g, 'color="#FFFFFF"');
code = code.replace(/color="#24C789"/g, 'color="#E11D48"');

// We also need to rewrite the stylesheet block entirely
const newStyles = `const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark premium mode
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140, // Space for the floating button
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  menuButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  brandBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.9,
  },
  brandText: {
    color: '#FFF',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 16,
    color: '#8A8D93',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#111214', // Deep athletic dark grey
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  cardTitle: {
    fontSize: 14,
    color: '#8A8D93',
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statWrap: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#8A8D93',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2C31',
  },
  progressContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2C31',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTextLabel: {
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressPercent: {
    fontSize: 14,
    color: '#E11D48',
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1C1D21',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 4,
  },
  weatherCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weatherTip: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '500',
  },
  weatherDesc: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '500',
  },
  friendPushCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  friendPushAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1D21',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendPushAvatarText: {
    fontSize: 24,
  },
  friendPushMeta: {
    flex: 1,
  },
  friendPushName: {
    fontWeight: '800',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  friendPushAction: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E11D48',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recentRunCard: {
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  runIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#1C1D21',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  runDate: {
    fontSize: 13,
    color: '#8A8D93',
    fontWeight: '600',
  },
  runStats: {
    alignItems: 'flex-end',
  },
  runDistance: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E11D48',
  },
  runTime: {
    fontSize: 13,
    color: '#8A8D93',
    marginTop: 4,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridBox: {
    width: (width - 56) / 2, // 20 padding each side + 16 gap
    backgroundColor: '#111214',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2C31',
  },
  gridBoxEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  startButton: {
    backgroundColor: '#E11D48',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(225, 29, 72, 0.4)',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  }
});`;

code = code.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);/, newStyles);

fs.writeFileSync('screens/HomeScreen.js', code);
console.log('HomeScreen patched');
