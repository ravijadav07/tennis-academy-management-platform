import fs from 'fs';

const history = JSON.parse(fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/src/mocks/seed.history.json', 'utf8'));

console.log('Top level keys in seed.history.json:', Object.keys(history));

Object.keys(history).forEach(key => {
  if (Array.isArray(history[key])) {
    console.log(`- ${key}: ${history[key].length} items`);
    if (history[key].length > 0) {
      console.log(`  Sample item keys for ${key}:`, Object.keys(history[key][0]));
    }
  }
});
