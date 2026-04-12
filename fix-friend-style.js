const fs = require('fs');
let text = fs.readFileSync('styles/FriendsScreenStyles.js', 'utf-8');

// The file might end with:
// });
// modalOverlay: { ...
// I will strip the recently appended text and re-inject it properly.

const splitPoint = text.lastIndexOf("});");
if (splitPoint !== -1) {
  const goodProps = text.substring(0, splitPoint); // everything inside StyleSheet.create({
  
  const inject = `
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  profileSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetAvatar: {
    fontSize: 64,
    marginBottom: 10,
  },
  sheetName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sheetPhone: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sheetStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    padding: 20,
  },
  sheetStatBox: {
    alignItems: 'center',
  },
  sheetStatVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#24C789',
  },
  sheetStatLbl: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  chatBtn: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  chatBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  removeFriendBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  removeFriendBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
`;
  fs.writeFileSync('styles/FriendsScreenStyles.js', goodProps + ",\n" + inject);
}
