import XLSX from 'xlsx';
import path from 'path';

const filePath = 'd:/Ravi/Ravi/Tennis Academy Platform/Basic Program Details for ATA.xlsx';
const workbook = XLSX.readFile(filePath);
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log('\n========================================');
  console.log('SHEET:', sheetName);
  console.log('========================================');
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  jsonData.forEach((row, idx) => {
    if (row && row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
      console.log(`Row ${idx + 1}:`, JSON.stringify(row));
    }
  });
});
