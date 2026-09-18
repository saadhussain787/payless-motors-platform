/**
 * ledgerHandler.js
 * Handles fetching and updating journal entries in the PaylessJournalEntriesTable.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.RECEIPT_TABLE_NAME || 'PaylessJournalEntries';

exports.handler = async (event) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;

    if (httpMethod === 'GET') {
      // For now, scan the table to get all PENDING entries.
      // In production, we'd query by Global Secondary Index (StatusIndex)
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#st = :status',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'PENDING'
        }
      });

      const response = await docClient.send(command);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries: response.Items || [] })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('Ledger Handler Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
