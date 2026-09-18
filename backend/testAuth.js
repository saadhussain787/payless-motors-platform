const { getQboConfig } = require('./qboAuth');

const companies = [
  'PAYLESS_MOTORS',
  'ROYAL_MOTORS',
  'TQM',
  'GREAT_MOTOR_AUTO'
];

console.log('--- Testing Multi-Entity QBO Configurations ---\n');

companies.forEach(companyKey => {
  try {
    const config = getQboConfig(companyKey);
    console.log(`Entity: ${config.name}`);
    console.log(JSON.stringify(config, null, 2));
    console.log('\n----------------------------------------\n');
  } catch (error) {
    console.error(`Error loading config for ${companyKey}:`, error.message);
  }
});
