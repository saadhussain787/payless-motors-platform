const { parseReceipt } = require('./extractReceipt');
const { syncJournalEntry } = require('./syncQBO');

const sampleReceiptText = `
-----------------------------------
       ROYAL REPAIRS INC.
-----------------------------------
Date: 2026-09-17
VIN: 5T1ABC123XXXXXXX

Parts Subtotal:          $400.00
HST (13%):                $52.00
-----------------------------------
Total Due:               $452.00
-----------------------------------
`;

console.log('=== Running Full Pipeline Test ===\n');

// 1. Parse the receipt to extract the journal payload
console.log('[Step 1] Parsing receipt to double-entry journal payload...');
const result = parseReceipt(sampleReceiptText);
const journalPayload = result.aiResponsePayload.qboJournalPayload;
console.log('Extraction complete.\n');

// 2. Sync to QuickBooks Online for the specific company
console.log('[Step 2] Pushing payload to QuickBooks Online...');
// Using 'ROYAL_MOTORS' to match the key defined in qboAuth.js
syncJournalEntry('ROYAL_MOTORS', journalPayload);

console.log('=== Pipeline Test Complete ===');
