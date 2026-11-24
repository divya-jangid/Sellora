require('dotenv').config();

const sendGmailEmail = require('./gmailMailer');

const testEmail = async () => {
    try {
        await sendGmailEmail({
            to: 'lovekumawat1432@gmail.com',
            subject: 'Sellora Gmail API Test',
            html: '<h2>Hello!</h2><p>Sellora Gmail API is working successfully.</p>'
        });

        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
};

testEmail();