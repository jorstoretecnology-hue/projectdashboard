const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/supabase/database.types.ts');
const code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

const outLines = [];
let insideTable = false;
let braceCount = 0;

// The structure of database.types.ts inside Tables:
// SomeTable: {
//   Row: { ... }
//   Insert: { ... }
//   Update: { ... }
// }
// We want to add Relationships: [] after Update finishes.
// Or just check if the line before the table's closing brace has 'Relationships'.

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  outLines.push(line);

  // If we see `Update:` we track until it closes.
  if (line.match(/^\s*Update:\s*\{\s*$/)) {
    let j = i + 1;
    let localBraceCount = 1;
    while (j < lines.length && localBraceCount > 0) {
      outLines.push(lines[j]);
      if (lines[j].includes('{')) localBraceCount++;
      if (lines[j].includes('}')) localBraceCount--;
      
      if (localBraceCount === 0) {
        // We reached the end of Update
        // Check if the next line is Relationships or the table ends
        let nextLine = lines[j+1] || '';
        if (!nextLine.includes('Relationships')) {
          outLines.push('        Relationships: []');
        }
        i = j;
        break;
      }
      j++;
    }
  }
}

fs.writeFileSync(filePath, outLines.join('\n'));
console.log('Fixed relationships');
