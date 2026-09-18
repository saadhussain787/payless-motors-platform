const { parseReceipt } = require('./extractReceipt');

const sampleReceiptText = `
-----------------------------------
      SAMPLE AUTO PARTS INC.
-----------------------------------
Date: 2026-09-17
VIN: 2T1BR32EXXXXXXXX

Parts Subtotal:          $250.00
HST (13%):                $32.50
-----------------------------------
Total Due:               $282.50
-----------------------------------
`;

console.log('--- Testing Receipt Extraction & QBO Journal Mapping ---\n');
console.log('Sample Input Text:');
console.log(sampleReceiptText);

// Call the extraction function
const result = parseReceipt(sampleReceiptText);

console.log('\n--- Generated Double-Entry Journal Payload ---\n');
console.log(JSON.stringify(result.aiResponsePayload.qboJournalPayload, null, 2));
