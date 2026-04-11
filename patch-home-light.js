const fs = require('fs');

let code = fs.readFileSync('screens/HomeScreen.js', 'utf8');

// The JSX is already mostly correct except colors! Wait, earlier I did:
// code = code.replace(/color="#222222"/g, 'color="#FFFFFF"');
// code = code.replace(/color="#24C789"/g, 'color="#E11D48"');
// I need to reverse this.

code = code.replace(/color="#FFFFFF"/g, 'color="#222222"');
code = code.replace(/color="#E11D48"/g, 'color="#24C789"');

// And rewriting the stylesheet completely. Let's just output the original KEEP light mode styles!
const newStyles = `const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
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
    backgroundColor: '#24C789',
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
    color: '#888888',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEEEEE',
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTextLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    color: '#24C789',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#24C789',
    borderRadius: 4,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#E8F8F2',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherMeta: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  weatherTip: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  weatherDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  friendPushCard: {
    backgroundColor: '#FFF4E5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  friendPushAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD180',
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
    fontWeight: 'bold',
    fontSize: 16,
    color: '#E65100',
    marginBottom: 2,
  },
  friendPushAction: {
    color: '#FF9800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: '#24C789',
    fontWeight: '600',
    marginBottom: 16,
  },
  recentRunCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  runIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  runDate: {
    fontSize: 13,
    color: '#888',
  },
  runStats: {
    alignItems: 'flex-end',
  },
  runDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#24C789',
  },
  runTime: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridBox: {
    width: (width - 56) / 2, // 20 padding each side + 16 gap
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridBoxEmpty: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  gridText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  startActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 10,
    backgroundColor: 'transparent', 
  },
  startButton: {
    backgroundColor: '#24C789',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});`;

code = code.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);/, newStyles);

fs.writeFileSync('screens/HomeScreen.js', code);
console.log('HomeScreen restored to lightKEEP mode');
