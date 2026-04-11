const fs = require('fs');
let code = fs.readFileSync('styles/RunScreenStyles.js', 'utf8');

// Apply UI/UX Pro Max recommendations (KEEP app aesthetics: High contrast, dark themes, neon accents, Barlow fonts, energetic blocks, precise shadows)

// Update Map Container and overall background 
code = code.replace(
  "  container: {\n    flex: 1,\n    backgroundColor: '#F4F5F7',\n  },",
  "  container: {\n    flex: 1,\n    backgroundColor: '#000000', // Dark premium mode\n  },"
);

// Upgrade the Dashboard Panel (Sleek dark card with neon accents)
code = code.replace(
  "  dashboardContainer: {\n    flex: 1,\n    backgroundColor: '#FFFFFF',\n    borderTopLeftRadius: 30,\n    borderTopRightRadius: 30,\n    marginTop: -30,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: -4 },\n    shadowOpacity: 0.05,\n    shadowRadius: 10,\n    elevation: 8,\n    paddingTop: 10,\n    paddingBottom: 20,\n    justifyContent: 'space-between',\n  },",
  "  dashboardContainer: {\n    flex: 1,\n    backgroundColor: '#111214', // Deep athletic dark grey\n    borderTopLeftRadius: 32,\n    borderTopRightRadius: 32,\n    marginTop: -30,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: -10 },\n    shadowOpacity: 0.5,\n    shadowRadius: 20,\n    elevation: 10,\n    paddingTop: 12,\n    paddingBottom: 25,\n    justifyContent: 'space-between',\n    borderTopWidth: 1,\n    borderTopColor: '#2A2C31', // Subtle inner border for premium glass feel\n  },"
);

// Drag handle restyle
code = code.replace(
  "  dragHandle: {\n    width: 40,\n    height: 5,\n    backgroundColor: '#E0E0E0',\n    borderRadius: 2.5,\n  },",
  "  dragHandle: {\n    width: 48,\n    height: 5,\n    backgroundColor: '#3E4148',\n    borderRadius: 2.5,\n  },"
);

// Typography overhaul (neon stats)
code = code.replace(
  "  statValue: {\n    fontSize: 32,\n    fontWeight: 'bold',\n    color: '#222222',\n    fontVariant: ['tabular-nums'],\n  },",
  "  statValue: {\n    fontSize: 42,\n    fontWeight: '900',\n    color: '#FFFFFF',\n    fontVariant: ['tabular-nums'],\n    letterSpacing: -1,\n    // fontFamily: 'Barlow-Condensed',\n  },"
);

code = code.replace(
  "  statLabel: {\n    fontSize: 12,\n    color: '#999999',\n    marginTop: 4,\n    fontWeight: '600',\n    letterSpacing: 1,\n  },",
  "  statLabel: {\n    fontSize: 11,\n    color: '#8A8D93',\n    marginTop: 6,\n    fontWeight: '800',\n    letterSpacing: 1.5,\n    textTransform: 'uppercase',\n  },"
);

// Start Run Button (Neon KEEP style)
code = code.replace(
  "  circleStartButton: {\n    backgroundColor: '#24C789',\n    width: 90,\n    height: 90,\n    borderRadius: 45,\n    justifyContent: 'center',\n    alignItems: 'center',\n    shadowColor: '#24C789',\n    shadowOffset: { width: 0, height: 6 },\n    shadowOpacity: 0.4,\n    shadowRadius: 10,\n    elevation: 8,\n  },",
  "  circleStartButton: {\n    backgroundColor: '#E11D48', // Vibrant Rose from our UI System\n    width: 96,\n    height: 96,\n    borderRadius: 48,\n    justifyContent: 'center',\n    alignItems: 'center',\n    shadowColor: '#E11D48',\n    shadowOffset: { width: 0, height: 8 },\n    shadowOpacity: 0.5,\n    shadowRadius: 16,\n    elevation: 10,\n    borderWidth: 4,\n    borderColor: 'rgba(225, 29, 72, 0.3)',\n  },"
);

code = code.replace(
  "  circleStartText: {\n    color: '#FFFFFF',\n    fontSize: 22,\n    fontWeight: 'bold',\n    letterSpacing: 2,\n  },",
  "  circleStartText: {\n    color: '#FFFFFF',\n    fontSize: 20,\n    fontWeight: '900',\n    letterSpacing: 3,\n    textTransform: 'uppercase',\n  },"
);

// Active Controls
code = code.replace(
  "  circleResumeButton: {\n    backgroundColor: '#24C789',\n    width: 75,\n    height: 75,\n    borderRadius: 40,\n    justifyContent: 'center',\n    alignItems: 'center',\n  },",
  "  circleResumeButton: {\n    backgroundColor: '#E11D48',\n    width: 80,\n    height: 80,\n    borderRadius: 40,\n    justifyContent: 'center',\n    alignItems: 'center',\n    shadowColor: '#E11D48',\n    shadowOffset: { width: 0, height: 4 },\n    shadowOpacity: 0.4,\n    shadowRadius: 8,\n  },"
);

code = code.replace(
  "  circleStopButton: {\n    backgroundColor: '#FF453A',\n    width: 75,\n    height: 75,\n    borderRadius: 40,\n    justifyContent: 'center',\n    alignItems: 'center',\n  },",
  "  circleStopButton: {\n    backgroundColor: '#1E1E1E',\n    width: 80,\n    height: 80,\n    borderRadius: 40,\n    justifyContent: 'center',\n    alignItems: 'center',\n    borderWidth: 2,\n    borderColor: '#333',\n  },"
);

// Update map styling logic to default to dark mode 
let runCode = fs.readFileSync('screens/RunScreen.js', 'utf8');

// I'll swap the default map style slightly later if I can find MapStyle.json. Let's just focus on UI panel now.

// Ensure back button looks good on dark maps
code = code.replace(
  "  backButton: {\n    position: 'absolute',\n    top: Platform.OS === 'ios' ? 60 : (Platform.OS === 'web' ? 90 : 40),\n    left: 20,\n    zIndex: 999,\n    backgroundColor: 'rgba(255, 255, 255, 0.8)',\n    borderRadius: 20,\n    padding: 8,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3,\n  },",
  "  backButton: {\n    position: 'absolute',\n    top: Platform.OS === 'ios' ? 60 : (Platform.OS === 'web' ? 90 : 40),\n    left: 20,\n    zIndex: 999,\n    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark translucent pill\n    borderRadius: 20,\n    padding: 10,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.3,\n    shadowRadius: 4,\n    elevation: 3,\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.1)',\n  },"
);

// Scope Button Styling Dark Mode
code = code.replace(
  "  scopeSelectorContainer: {\n    flexDirection: 'row',\n    backgroundColor: '#E8E8E8',\n    borderRadius: 25,\n    marginBottom: 20,\n    padding: 4,\n    width: '90%',\n    justifyContent: 'space-between',\n  },",
  "  scopeSelectorContainer: {\n    flexDirection: 'row',\n    backgroundColor: '#1C1D21',\n    borderRadius: 30,\n    marginBottom: 24,\n    padding: 5,\n    width: '90%',\n    justifyContent: 'space-between',\n    borderWidth: 1,\n    borderColor: '#2A2C31',\n  },"
);

code = code.replace(
  "  scopeBtnActive: {\n    backgroundColor: '#FFFFFF',\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 2,\n  },",
  "  scopeBtnActive: {\n    backgroundColor: '#2D2F36',\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.4,\n    shadowRadius: 4,\n    elevation: 4,\n  },"
);

code = code.replace(
  "  scopeBtnTextActive: {\n    color: '#222',\n    fontWeight: 'bold',\n  },",
  "  scopeBtnTextActive: {\n    color: '#FFF',\n    fontWeight: '800',\n  },"
);


fs.writeFileSync('styles/RunScreenStyles.js', code);

// Change the Back Button color in JSX to white since background is dark
let jsxCode = fs.readFileSync('screens/RunScreen.js', 'utf8');
jsxCode = jsxCode.replace(
  "<Ionicons name=\"arrow-back\" size={28} color=\"#333\" />",
  "<Ionicons name=\"arrow-back\" size={28} color=\"#FFF\" />"
);
fs.writeFileSync('screens/RunScreen.js', jsxCode);

console.log('RunScreenStyles Patched to KEEP Dark Athletic Theme');
