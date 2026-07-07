const fs = require('fs');
const path = './components/SettingsScreen.tsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// We know the duplicate advanced section starts at line 378 and ends around 442.
// Let's find the exact indices.
const startIdx = lines.findIndex((l, i) => i > 370 && l.includes('{/* Advanced Section */}'));
let endIdx = -1;

// The block ends with `            )}` just before the last `        </div>`
// There's a second `        {/* Advanced Section */}` that we want to keep.
if (startIdx !== -1) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('            )}')) {
        // Let's ensure it's the right one (before the activeTab === 'users' check or the second Advanced Section)
        if (i < 450) { // Since the second one starts at 450
            endIdx = i;
        }
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Removed duplicate section');
} else {
  console.log('Indices not found', startIdx, endIdx);
}
