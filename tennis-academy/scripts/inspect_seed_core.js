import fs from 'fs';

const core = JSON.parse(fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/src/mocks/seed.core.json', 'utf8'));

console.log('Top level keys in seed.core.json:', Object.keys(core));

Object.keys(core).forEach(key => {
  if (Array.isArray(core[key])) {
    console.log(`- ${key}: ${core[key].length} items`);
    if (core[key].length > 0) {
      console.log(`  Sample item keys for ${key}:`, Object.keys(core[key][0]));
    }
  }
});
