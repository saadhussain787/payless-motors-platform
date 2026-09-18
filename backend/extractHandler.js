const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { parseReceipt } = require('./extractReceipt');
const { randomUUID } = require('crypto');

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(dbClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ca-central-1' });
const TABLE_NAME = 'PaylessJournalEntries';

exports.handler = async (event) => {
  try {
    let imageData;
    let entityId = 'UNASSIGNED';

    // Handle S3 Upload Event
    if (event.Records && event.Records[0].eventSource === 'aws:s3') {
      const record = event.Records[0];
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Extract entityId from folder structure if present (e.g., ROYAL_MOTORS/invoice.jpg)
      const parts = key.split('/');
      if (parts.length > 1) {
        entityId = parts[0];
      }

      // Download from S3
      const s3Object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const streamToString = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString('base64')));
      });
      imageData = await streamToString(s3Object.Body);
    } 
    // Handle API Gateway POST
    else if (event.body) {
      const body = JSON.parse(event.body);
      imageData = body.imageData;
      entityId = body.entityId || 'PAYLESS_MOTORS';
    }

    if (!imageData) {
      throw new Error('No image data found in event.');
    }

    // Invoke the parser
    const result = await parseReceipt(imageData);
    
    // Check if AI requested Ask Accountant
    let initialStatus = 'PENDING';
    const payloadStr = JSON.stringify(result.aiResponsePayload.qboJournalPayload);
    if (payloadStr.includes('"value":"9999"') || payloadStr.includes('"value": "9999"')) {
      initialStatus = 'NEEDS_REVIEW';
    }

    // Create the DB record
    const entryId = randomUUID();
    const Item = {
      entityId,
      entryId,
      status: initialStatus,
      vin: result.aiResponsePayload.extractedData.vin || 'UNKNOWN',
      vendorName: result.aiResponsePayload.extractedData.vendor,
      date: result.aiResponsePayload.extractedData.date,
      subtotal: result.aiResponsePayload.extractedData.subtotal,
      hstAmount: result.aiResponsePayload.extractedData.hst,
      total: result.aiResponsePayload.extractedData.total,
      journalPayload: result.aiResponsePayload.qboJournalPayload,
      smartAction: result.aiResponsePayload.smartAction,
      createdAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Extraction successful',
        Item
      })
    };
  } catch (error) {
    console.error('Error in extractHandler:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
