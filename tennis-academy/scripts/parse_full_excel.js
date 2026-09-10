import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'd:/Ravi/Ravi/Tennis Academy Platform/Basic Program Details for ATA.xlsx';
const workbook = XLSX.readFile(filePath);

const result = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  result[sheetName] = jsonData;
});

fs.writeFileSync(
  'd:/Ravi/Ravi/Tennis Academy Platform/tennis-academy/scripts/parsed_excel.json',
  JSON.stringify(result, null, 2)
);

console.log('Successfully written parsed_excel.json');
