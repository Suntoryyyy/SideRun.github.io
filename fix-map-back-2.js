const fs = require('fs');
let code = fs.readFileSync('components/RunScreenUI/RunMapMemo.js', 'utf8');
if (!code.includes('</BlurView>\\n        </TouchableOpacity>')) {
  // If the first regex didn't catch it
  code = code.replace(
    /<BlurView intensity=\{80\} tint="light" style=\{\{ padding: 10, borderRadius: 20 \}\}>\n\s*<Ionicons name="arrow-back" size=\{28\} color="#333" \/>\n\s*<\/TouchableOpacity>/,
    '<BlurView intensity={80} tint="light" style={{ padding: 10, borderRadius: 20 }}>\n          <Ionicons name="arrow-back" size={28} color="#333" />\n          </BlurView>\n        </TouchableOpacity>'
  );
  fs.writeFileSync('components/RunScreenUI/RunMapMemo.js', code);
}
