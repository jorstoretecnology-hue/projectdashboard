const fs = require('fs');
const path = require('path');

const filePath = path.join('e:', 'ProyectDashboard', 'src', 'lib', 'supabase', 'database.types.ts');

try {
  // Read as buffer
  const buffer = fs.readFileSync(filePath);
  
  // Detect if it's UTF-16LE (BOM is FF FE or just check if every second byte is 0 for ASCII)
  // Or just try to decode it.
  const content = buffer.toString('utf16le');
  
  // Write back as UTF-8
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully converted database.types.ts to UTF-8');
} catch (error) {
  console.error('Error converting file:', error);
  process.exit(1);
}
