require('dotenv').config();

const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.send']
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nPaste the authorization code here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code.trim());

        console.log('\nYour Gmail refresh token:\n');
        console.log(tokens.refresh_token);

        rl.close();
    } catch (error) {
        console.error('Token error:', error.message);
        rl.close();
    }
});