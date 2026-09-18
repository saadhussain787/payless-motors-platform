const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { syncJournalEntry } = require('./syncQBO');

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(dbClient);
const TABLE_NAME = 'PaylessJournalEntries';

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { companyKey, journalPayload, entityId, entryId } = body;

    // Invoke sync functionality
    await syncJournalEntry(companyKey, journalPayload);

    // Update the DynamoDB record status to 'SYNCED' if we have the keys
    if (entityId && entryId) {
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { entityId, entryId },
        UpdateExpression: 'set #s = :statusVal',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':statusVal': 'SYNCED' }
      }));
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
