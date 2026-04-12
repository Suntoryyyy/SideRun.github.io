const fs = require('fs');

let code = fs.readFileSync('screens/LoginScreen.js', 'utf-8');
code = code.replace(
  "  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' \n  clearDataButton: {\n    flexDirection: 'row',\n    justifyContent: 'center',\n    alignItems: 'center',\n    marginTop: 40,\n    padding: 10,\n    opacity: 0.7,\n  },\n  clearDataText: {\n    color: '#FF3B30',\n    fontSize: 14,\n    fontWeight: '600',\n    marginLeft: 6,\n  },\n});",
  "  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });"
);

if (!code.includes("clearDataButton:")) {
  code = code.replace(
    "\n\n\n});",
    `
  clearDataButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    padding: 10,
    opacity: 0.7,
  },
  clearDataText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});`
  );
}

fs.writeFileSync('screens/LoginScreen.js', code);
