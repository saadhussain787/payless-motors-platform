const AWS = require('aws-sdk');
const { parseReceipt } = require('./extractReceipt');
const { v4: uuidv4 } = require('uuid');

const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
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
      const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
      imageData = s3Object.Body.toString('base64');
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
    const result = parseReceipt(imageData);
    
    // Create the DB record
    const entryId = uuidv4();
    const Item = {
      entityId,
      entryId,
      status: 'PENDING',
      vin: result.aiResponsePayload.extractedData.vin || 'UNKNOWN',
      vendorName: result.aiResponsePayload.extractedData.vendorName,
      date: result.aiResponsePayload.extractedData.date,
      subtotal: result.aiResponsePayload.extractedData.subtotal,
      hstAmount: result.aiResponsePayload.extractedData.hstAmount,
      total: result.aiResponsePayload.extractedData.total,
      journalPayload: result.aiResponsePayload.qboJournalPayload,
      createdAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await docClient.put({
      TableName: TABLE_NAME,
      Item
    }).promise();

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
