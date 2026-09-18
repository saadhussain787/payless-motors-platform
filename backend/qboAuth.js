/**
 * qboAuth.js
 * 
 * Manages multi-company OAuth token structures for QuickBooks Online (QBO).
 * Entities:
 * - Payless Motors
 * - Royal Motors
 * - TQM
 * - Great Motor Auto
 */

// Define the supported entities and map them to their QBO configurations
// Tokens and credentials are managed via environment variables
const qboEntities = {
  PAYLESS_MOTORS: {
    name: 'Payless Motors',
    clientId: process.env.PAYLESS_QBO_CLIENT_ID,
    clientSecret: process.env.PAYLESS_QBO_CLIENT_SECRET,
    redirectUri: process.env.PAYLESS_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
    // Placeholder for token storage. In a real application, 
    // these should be stored securely in a database or key vault.
    tokens: {
      realmId: process.env.PAYLESS_QBO_REALM_ID,
      accessToken: process.env.PAYLESS_QBO_ACCESS_TOKEN,
      refreshToken: process.env.PAYLESS_QBO_REFRESH_TOKEN,
      tokenExpiresAt: process.env.PAYLESS_QBO_TOKEN_EXPIRES_AT, // timestamp
    }
  },
  ROYAL_MOTORS: {
    name: 'Royal Motors',
    clientId: process.env.ROYAL_QBO_CLIENT_ID,
    clientSecret: process.env.ROYAL_QBO_CLIENT_SECRET,
    redirectUri: process.env.ROYAL_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
    tokens: {
      realmId: process.env.ROYAL_QBO_REALM_ID,
      accessToken: process.env.ROYAL_QBO_ACCESS_TOKEN,
      refreshToken: process.env.ROYAL_QBO_REFRESH_TOKEN,
      tokenExpiresAt: process.env.ROYAL_QBO_TOKEN_EXPIRES_AT,
    }
  },
  TQM: {
    name: 'TQM',
    clientId: process.env.TQM_QBO_CLIENT_ID,
    clientSecret: process.env.TQM_QBO_CLIENT_SECRET,
    redirectUri: process.env.TQM_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
    tokens: {
      realmId: process.env.TQM_QBO_REALM_ID,
      accessToken: process.env.TQM_QBO_ACCESS_TOKEN,
      refreshToken: process.env.TQM_QBO_REFRESH_TOKEN,
      tokenExpiresAt: process.env.TQM_QBO_TOKEN_EXPIRES_AT,
    }
  },
  GREAT_MOTOR_AUTO: {
    name: 'Great Motor Auto',
    clientId: process.env.GMA_QBO_CLIENT_ID,
    clientSecret: process.env.GMA_QBO_CLIENT_SECRET,
    redirectUri: process.env.GMA_QBO_REDIRECT_URI,
    environment: process.env.QBO_ENVIRONMENT || 'sandbox',
    tokens: {
      realmId: process.env.GMA_QBO_REALM_ID,
      accessToken: process.env.GMA_QBO_ACCESS_TOKEN,
      refreshToken: process.env.GMA_QBO_REFRESH_TOKEN,
      tokenExpiresAt: process.env.GMA_QBO_TOKEN_EXPIRES_AT,
    }
  }
};

/**
 * Retrieves the OAuth configuration and current tokens for a specific entity.
 * @param {string} entityKey - The key of the entity (e.g., 'PAYLESS_MOTORS')
 * @returns {object} The QBO configuration object for the entity
 */
function getQboConfig(entityKey) {
  const config = qboEntities[entityKey];
  if (!config) {
    throw new Error(`Invalid QBO entity requested: ${entityKey}`);
  }
  return config;
}

/**
 * Updates the OAuth tokens for a specific entity in memory.
 * Note: You MUST also persist these to your database or secure storage.
 * 
 * @param {string} entityKey - The key of the entity (e.g., 'PAYLESS_MOTORS')
 * @param {object} newTokens - Object containing new token values
 */
function updateTokens(entityKey, newTokens) {
  const config = qboEntities[entityKey];
  if (!config) {
    throw new Error(`Invalid QBO entity requested: ${entityKey}`);
  }
  
  if (newTokens.realmId) config.tokens.realmId = newTokens.realmId;
  if (newTokens.accessToken) config.tokens.accessToken = newTokens.accessToken;
  if (newTokens.refreshToken) config.tokens.refreshToken = newTokens.refreshToken;
  if (newTokens.tokenExpiresAt) config.tokens.tokenExpiresAt = newTokens.tokenExpiresAt;
  
  console.log(`[QBO Auth] Updated tokens in memory for ${config.name}. Remember to persist to DB!`);
}

module.exports = {
  qboEntities,
  getQboConfig,
  updateTokens
};
