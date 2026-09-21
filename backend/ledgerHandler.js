/**
 * ledgerHandler.js
 * Handles fetching and updating journal entries in the PaylessJournalEntriesTable.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.RECEIPT_TABLE_NAME || 'PaylessJournalEntries';

exports.handler = async (event) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;

    if (httpMethod === 'GET') {
      // Query the table by Global Secondary Index (StatusIndex)
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#st = :status',
        ExpressionAttributeNames: {
          '#st': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'PENDING'
        },
        Limit: 50
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
