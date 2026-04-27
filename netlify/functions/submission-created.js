const twilio = require('twilio');

exports.handler = async function (event) {
  const payload = JSON.parse(event.body).payload;
  const data = payload.data;

  const firstName = data['first-name'] || '';
  const lastName  = data['last-name']  || '';
  const email     = data['email']      || '';
  const phone     = data['phone']      || 'not provided';
  const company   = data['company']    || 'not provided';
  const website   = data['website']    || 'not provided';
  const message   = data['message']    || '';

  const smsBody = [
    `New TWD lead!`,
    `${firstName} ${lastName} | ${company}`,
    `📞 ${phone}`,
    `✉️ ${email}`,
    `🌐 ${website}`,
    `💬 ${message}`
  ].join('\n');

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: smsBody,
    from: process.env.TWILIO_FROM_NUMBER,
    to: process.env.TWILIO_TO_NUMBER,
  });

  return { statusCode: 200 };
};