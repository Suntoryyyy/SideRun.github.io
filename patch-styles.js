const fs = require('fs');
let ss = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf8');

ss = ss.replace(/paddingTop: 60,/, 'paddingTop: 65,');
ss = ss.replace(/top: 60,/, 'top: 65,\n    width: 40,\n    height: 40,\n    justifyContent: "center",\n    alignItems: "center",');
ss = ss.replace(/fontSize: 28,/, 'fontSize: 22,\n    marginTop: 4,\n    maxWidth: "70%",\n    textAlign: "center",');

const feedStyles = `
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  feedAvatarEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  feedHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  feedName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  feedTime: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  feedMapPlaceholder: {
    height: 160,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  feedMapText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  feedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  feedStatBox: {
    alignItems: 'center',
  },
  feedStatVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222',
  },
  feedStatLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    paddingHorizontal: 10,
  },
  feedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  feedActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginLeft: 8,
  },
  emptyFeedState: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyFeedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888',
    marginTop: 16,
  },
`;

ss = ss.replace(/}\);\s*$/, feedStyles + '\n});\n');
fs.writeFileSync('styles/FriendsScreenStyles.js', ss);
