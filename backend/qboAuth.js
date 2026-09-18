/**
 * qboAuth.js
 * 
 * Manages multi-company OAuth token structures for QuickBooks Online (QBO).
 * Tokens and credentials are managed via environment variables and DynamoDB.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ca-central-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TOKEN_TABLE = process.env.TOKEN_TABLE_NAME || 'PaylessQBOTokens';

const qboEntities = {
  PAYLESS_MOTORS: {
    name: 'Payless Motors',
    clientId: process.env.PAYLESS_QBO_CLIENT_ID,
    clientSecret: process.env.PAYLESS_QBO_CLIENT_SECRET,
    redirectUri: process.env.PAYLESS_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
  },
  ROYAL_MOTORS: {
    name: 'Royal Motors',
    clientId: process.env.ROYAL_QBO_CLIENT_ID,
    clientSecret: process.env.ROYAL_QBO_CLIENT_SECRET,
    redirectUri: process.env.ROYAL_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
  },
  TQM: {
    name: 'TQM',
    clientId: process.env.TQM_QBO_CLIENT_ID,
    clientSecret: process.env.TQM_QBO_CLIENT_SECRET,
    redirectUri: process.env.TQM_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
  },
  GREAT_MOTOR_AUTO: {
    name: 'Great Motor Auto',
    clientId: process.env.GMA_QBO_CLIENT_ID,
    clientSecret: process.env.GMA_QBO_CLIENT_SECRET,
    redirectUri: process.env.GMA_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
  }
};

/**
 * Retrieves the OAuth configuration and current tokens for a specific entity from DynamoDB.
 * @param {string} entityKey - The key of the entity (e.g., 'PAYLESS_MOTORS')
 * @returns {Promise<object>} The QBO configuration object including tokens
 */
async function getQboConfig(entityKey) {
  const config = qboEntities[entityKey];
  if (!config) {
    throw new Error(`Invalid QBO entity requested: ${entityKey}`);
  }

  try {
    const command = new GetCommand({
      TableName: TOKEN_TABLE,
      Key: { entityId: entityKey }
    });
    
    const response = await docClient.send(command);
    const tokens = response.Item ? response.Item : {};

    // Fallback to env vars if not in DB
    const prefix = entityKey.split('_')[0];
    return {
      ...config,
      tokens: {
        realmId: tokens.realmId || process.env[`${prefix}_QBO_REALM_ID`],
        accessToken: tokens.accessToken || process.env[`${prefix}_QBO_ACCESS_TOKEN`],
        refreshToken: tokens.refreshToken || process.env[`${prefix}_QBO_REFRESH_TOKEN`],
        tokenExpiresAt: tokens.tokenExpiresAt || process.env[`${prefix}_QBO_TOKEN_EXPIRES_AT`]
      }
    };
  } catch (err) {
    console.error(`[QBO Auth] Error fetching tokens for ${entityKey}:`, err);
    throw new Error('Failed to retrieve QBO tokens from database.');
  }
}

/**
 * Updates the OAuth tokens for a specific entity in DynamoDB.
 * 
 * @param {string} entityKey - The key of the entity (e.g., 'PAYLESS_MOTORS')
 * @param {object} newTokens - Object containing new token values
 */
async function updateTokens(entityKey, newTokens) {
  const config = qboEntities[entityKey];
  if (!config) {
    throw new Error(`Invalid QBO entity requested: ${entityKey}`);
  }
  
  try {
    const command = new PutCommand({
      TableName: TOKEN_TABLE,
      Item: {
        entityId: entityKey,
        ...newTokens,
        updatedAt: new Date().toISOString()
      }
    });

    await docClient.send(command);
    console.log(`[QBO Auth] Successfully updated tokens in DynamoDB for ${config.name}.`);
  } catch (err) {
    console.error(`[QBO Auth] Error saving tokens for ${entityKey}:`, err);
    throw new Error('Failed to save QBO tokens to database.');
  }
}

module.exports = {
  qboEntities,
  getQboConfig,
  updateTokens
};
