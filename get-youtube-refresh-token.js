const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '226110409208-tdvm230nqkhvau7sfcf65tp0k8vh8q2f.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost'; // Changed to simple localhost for manual code copy

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Your refresh token:', tokens.refresh_token);
  } catch (err) {
    console.error('Error retrieving access token', err);
  }
  rl.close();
});
