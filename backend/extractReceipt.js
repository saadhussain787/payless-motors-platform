/**
 * extractReceipt.js
 * 
 * Placeholder logic for OCR/AI-based receipt extraction.
 */

/**
 * Parses receipt image data and returns structured financial data.
 * 
 * @param {Buffer|string} imageData - The raw image data, base64 string, or path to the image
 * @returns {object} Extracted receipt schema and QBO journal payload
 */
function parseReceipt(imageData) {
  const systemPrompt = `
You are a precise financial AI agent performing OCR on repair and parts invoices for Payless Motors.
Your primary task is to extract the following critical fields: vendorName, date, vin, subtotal, hstAmount (assuming 13% HST), and total.

Based on the extracted values, you must output a balanced double-entry QuickBooks journal payload using the following chart of accounts:
- 1201 Inventory WIP (Debit the subtotal amount)
- 2400 HST Payable 13% (Debit the HST amount)
- 2000 Accounts Payable (Credit the total invoice amount)

Ensure the debits and credits balance perfectly. Return the data as a structured JSON object.
  `.trim();

  // TODO: Send imageData and systemPrompt to the AI model here.
  // Returning the system prompt and a mock of what the AI should output:
  return {
    promptUsed: systemPrompt,
    aiResponsePayload: {
      extractedData: {
        vendorName: "Sample Auto Parts Inc.",
        date: new Date().toISOString().split('T')[0],
        vin: "2T1BR32EXXXXXXXX",
        subtotal: 250.00,
        hstAmount: 32.50,
        total: 282.50
      },
      qboJournalPayload: {
        Line: [
          {
            DetailType: "JournalEntryLineDetail",
            Amount: 250.00,
            JournalEntryLineDetail: {
              PostingType: "Debit",
              AccountRef: {
                value: "1201",
                name: "Inventory WIP"
              }
            }
          },
          {
            DetailType: "JournalEntryLineDetail",
            Amount: 32.50,
            JournalEntryLineDetail: {
              PostingType: "Debit",
              AccountRef: {
                value: "2400",
                name: "HST Payable 13%"
              }
            }
          },
          {
            DetailType: "JournalEntryLineDetail",
            Amount: 282.50,
            JournalEntryLineDetail: {
              PostingType: "Credit",
              AccountRef: {
                value: "2000",
                name: "Accounts Payable"
              }
            }
          }
        ]
      }
    }
  };
}

module.exports = {
  parseReceipt
};
