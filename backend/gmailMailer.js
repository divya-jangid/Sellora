require('dotenv').config();

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client
});

const sendGmailEmail = async ({ to, subject, html }) => {
    try {
        if (!to || !subject || !html) {
            throw new Error('Recipient, subject and email content are required');
        }

        const fromEmail = process.env.GMAIL_USER_EMAIL;

        if (!fromEmail) {
            throw new Error('GMAIL_USER_EMAIL is missing in .env');
        }

        const messageParts = [
            `From: Sellora <${fromEmail}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            html
        ];

        const message = messageParts.join('\n');

        const encodedMessage = Buffer
            .from(message)
            .toString('base64url');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log('Gmail email sent:', response.data.id);

        return response.data;
    } catch (error) {
        console.error('Gmail email error:', error.message);
        throw error;
    }
};

module.exports = sendGmailEmail;