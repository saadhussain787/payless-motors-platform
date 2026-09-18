const AWS = require('aws-sdk');
const { syncJournalEntry } = require('./syncQBO');

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'PaylessJournalEntries';

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { companyKey, journalPayload, entityId, entryId } = body;

    // Invoke sync functionality
    syncJournalEntry(companyKey, journalPayload);

    // Update the DynamoDB record status to 'SYNCED' if we have the keys
    if (entityId && entryId) {
      await docClient.update({
        TableName: TABLE_NAME,
        Key: { entityId, entryId },
        UpdateExpression: 'set #s = :statusVal',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':statusVal': 'SYNCED' }
      }).promise();
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Sync complete' })
    };
  } catch (error) {
    console.error('Error in syncHandler:', error);
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
