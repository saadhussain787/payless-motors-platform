const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand, SetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'ca-central-1' });

const USER_POOL_ID = process.argv[2];

const users = [
  { email: 'owner@paylessmotors.com', group: 'Owner' },
  { email: 'controller@paylessmotors.com', group: 'Controller' },
  { email: 'technician@paylessmotors.com', group: 'Technician' }
];

async function createUsers() {
  if (!USER_POOL_ID) {
    console.error('Usage: node create_users.js <USER_POOL_ID>');
    process.exit(1);
  }

  for (const u of users) {
    try {
      console.log(`Creating user: ${u.email}...`);
      await client.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: u.email,
        UserAttributes: [
          { Name: 'email', Value: u.email },
          { Name: 'email_verified', Value: 'true' }
        ],
        MessageAction: 'SUPPRESS' // Don't send welcome email since this is a test
      }));

      console.log(`Setting permanent password for ${u.email}...`);
      await client.send(new SetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: u.email,
        Password: 'Password123!',
        Permanent: true
      }));

      console.log(`Adding ${u.email} to group: ${u.group}...`);
      await client.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: u.email,
        GroupName: u.group
      }));

      console.log(`Successfully created ${u.email} in ${u.group} group with password: Password123!`);
    } catch (err) {
      if (err.name === 'UsernameExistsException') {
        console.log(`User ${u.email} already exists.`);
      } else {
        console.error(`Failed to create ${u.email}:`, err.message);
      }
    }
  }
}

createUsers();
