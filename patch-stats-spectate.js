const fs = require('fs');

let ds = fs.readFileSync('components/RunScreenUI/MetricDashboard.js', 'utf8');

const spectatingLabel = /<Text style=\{\{ fontSize: 16, fontWeight: '700', color: '#FF9500' \}\}>\n                 🔴 Spectating: \{spectateFriend\.name\} \{spectateFriend\.avatar\}\n               <\/Text>/;

const newLabel = `<Text style={{ fontSize: 16, fontWeight: '700', color: '#FF9500' }}>
                 {signalLost ? "🔴 信号较弱..." : "🟢 当前同步:"} {spectateFriend.name} {spectateFriend.avatar}
               </Text>`;

ds = ds.replace(spectatingLabel, newLabel);
fs.writeFileSync('components/RunScreenUI/MetricDashboard.js', ds);
