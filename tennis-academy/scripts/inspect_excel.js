import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/scripts/parsed_excel.json', 'utf8'));

console.log('Sheets found:', Object.keys(data));

// MWF
console.log('\n--- MWF SAMPLE ROWS ---');
data['MWF'].slice(0, 25).forEach((r, i) => {
  if (r && r.some(c => c !== null)) {
    console.log(`R${i+1}:`, JSON.stringify(r));
  }
});

// TTS
console.log('\n--- TTS SAMPLE ROWS ---');
data['TTS'].slice(0, 25).forEach((r, i) => {
  if (r && r.some(c => c !== null)) {
    console.log(`R${i+1}:`, JSON.stringify(r));
  }
});
