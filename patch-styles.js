const fs = require('fs');

let stylesCode = fs.readFileSync('styles/RunScreenStyles.js', 'utf-8');

// Replace map container height to full screen
stylesCode = stylesCode.replace(
  "mapContainer: {\n    height: height * 0.55,",
  "mapContainer: {\n    height: height,"
);

// We need to redesign dashboard container to be absolutely positioned
const newDashboardContainer = `  dashboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.75, // 3/4 screen expanded
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    paddingTop: 12,
    paddingBottom: 25,
    justifyContent: 'space-between',
  },`;

stylesCode = stylesCode.replace(
  /  dashboardContainer: \{[\s\S]*?justifyContent: 'space-between',\n  \},/,
  newDashboardContainer
);

// Redesign Scope Selector
const newScopeSelector = `  scopeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(36, 199, 137, 0.1)',
    borderRadius: 30,
    marginBottom: 30,
    padding: 6,
    width: '85%',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(36, 199, 137, 0.2)',
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  scopeBtnActive: {
    backgroundColor: '#24C789',
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scopeBtnText: {
    fontSize: 14,
    color: '#24C789',
    fontWeight: '700',
  },
  scopeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },`;

stylesCode = stylesCode.replace(
  /  scopeSelectorContainer: \{[\s\S]*?fontWeight: 'bold',\n  \},/,
  newScopeSelector
);

// Small adjustments to stat values for fit
stylesCode = stylesCode.replace(
  "statValue: {\n    fontSize: 42,",
  "statValue: {\n    fontSize: 36,"
);

fs.writeFileSync('styles/RunScreenStyles.js', stylesCode);
