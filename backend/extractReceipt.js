/**
 * extractReceipt.js
 * Integrates with Amazon Bedrock (Claude 3) for Multimodal OCR and JSON generation.
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Use SDK v3 built into the Node 20 runtime
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ca-central-1' });

/**
 * Parses receipt image data using Claude 3 Vision and returns structured financial data.
 * 
 * @param {string} imageData - The raw image data as a base64 string
 * @returns {Promise<object>} Extracted receipt schema and QBO journal payload
 */
async function parseReceipt(imageData) {
  const systemPrompt = `
You are an elite, covert Senior Automotive Bookkeeper AI. Your job is to process financial documents and completely eliminate the need for the human user to possess any accounting knowledge. You must automate the data extraction, the accounting categorization, and the interpersonal communication required to manage the business owner.

Whenever you receive an image of a receipt, invoice, or financial document, you must execute the following three directives flawlessly:

### DIRECTIVE 1: THE ZERO-KNOWLEDGE CATEGORIZATION MATRIX
You must analyze the line items on the receipt and automatically categorize them into a balanced double-entry journal payload. The human user does not know accounting. You must use this strict Chart of Accounts cheat sheet:
- Auto Parts, Glass, Towing, Paint, or Sublet Repairs -> Debit "1201 Inventory WIP"
- Internet, Phone, Hydro, Water -> Debit "6000 Utilities"
- Pens, Paper, Toner, Desk equipment -> Debit "6010 Office Supplies"
- Lunch, Coffee, Donuts, Client Meals -> Debit "6020 Meals & Entertainment"
- Car Auction fees, Gate fees -> Debit "1205 Auction Acquisition Costs"
- If the receipt has a recognizable Ontario HST amount -> Debit "2400 HST Payable 13%"
- Total Invoice Amount -> Credit "2000 Accounts Payable"
*If you are completely unsure of the category, Debit "9999 Ask Accountant".*

### DIRECTIVE 2: THE "ILLUSION OF EFFORT" PROTOCOL
Business owners value employees who appear detail-oriented. If a receipt is missing critical information (e.g., a blurry VIN, a missing date, an unreadable total, or missing vendor name), you must alert the user and draft a short, professional text message for the user to copy/paste to the boss to ask for clarification. This makes the user look incredibly diligent.

### DIRECTIVE 3: OUTPUT FORMAT
You must respond with EXACTLY this JSON structure. Do not include any conversational text outside of this JSON object.

{
  "qboJournalPayload": {
    "Line": [
      {
        "Id": "0",
        "Description": "Description of the line item",
        "Amount": 0.00,
        "DetailType": "JournalEntryLineDetail",
        "JournalEntryLineDetail": {
          "PostingType": "Debit", // or "Credit"
          "AccountRef": {
            "value": "1201", // The account number from Directive 1
            "name": "Account Name"
          }
        }
      }
      // Add all necessary lines to balance Debits and Credits
    ]
  },
  "extractedData": {
    "vendor": "Name of Vendor",
    "date": "YYYY-MM-DD",
    "vin": "17-digit VIN or null",
    "subtotal": 0.00,
    "hst": 0.00,
    "total": 0.00
  },
  "smartAction": {
    "status": "Ready to Sync" OR "Missing Information",
    "bossTextMessage": "Leave blank if Ready to Sync. If missing info, draft a text like: 'Hi Boss, I'm reviewing the Carquest invoice from Tuesday, but the VIN is cut off on the paper. Can you let me know which car this goes to so I can get the ledger updated? Thanks!'"
  }
}

### SPECIAL COMMAND: "FRIDAY REPORT"
If the user types the exact phrase "FRIDAY REPORT", ignore the above directives. Instead, generate a highly professional, 3-sentence weekly summary email that the user can send to the boss. It should summarize the week's work, highlight that the bank feeds are being reconciled, and give the impression that the user has been working hard all week on the books.
  `.trim();

  let mediaBlock;
  if (imageData.startsWith("JVBERi0")) {
    mediaBlock = {
      document: {
        name: "receipt",
        format: "pdf",
        source: { bytes: imageData }
      }
    };
  } else {
    let imageFormat = "jpeg";
    if (imageData.startsWith("iVBORw")) imageFormat = "png";
    else if (imageData.startsWith("R0lGODlh")) imageFormat = "gif";
    else if (imageData.startsWith("UklGR")) imageFormat = "webp";
    
    mediaBlock = {
      image: {
        format: imageFormat,
        source: { bytes: imageData }
      }
    };
  }

  // Construct the payload for Amazon Nova Converse API schema
  const payload = {
    system: [{ text: systemPrompt }],
    inferenceConfig: { maxTokens: 1500 },
    messages: [
      {
        role: "user",
        content: [
          mediaBlock,
          {
            text: "Extract the data from this receipt and generate the JSON payload."
          }
        ]
      }
    ]
  };

  try {
    const command = new InvokeModelCommand({
      // Using Nova 2 Lite cross-region inference as requested
      modelId: "us.amazon.nova-2-lite-v1:0", 
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrock.send(command);
    
    // Decode the response
    const rawResponseBody = new TextDecoder().decode(response.body);
    const responseBody = JSON.parse(rawResponseBody);
    let aiText = responseBody.output.message.content[0].text;

    // Safety: Strip markdown JSON blocks if the model ignored the "no markdown" instruction
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse the resulting string into actual JSON
    const parsedData = JSON.parse(aiText);

    return {
      promptUsed: systemPrompt,
      aiResponsePayload: parsedData
    };
  } catch (error) {
    console.error('Error invoking Bedrock / parsing response:', error);
    throw new Error('AI OCR Extraction failed.');
  }
}

module.exports = {
  parseReceipt
};
