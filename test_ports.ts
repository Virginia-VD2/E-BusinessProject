import nodemailer from 'nodemailer';

async function testPort465() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'dungusvirginia2@gmail.com',
      pass: 'ujfzuthlvconvfjb',
    },
    connectionTimeout: 10000,
  });

  try {
    const info = await transporter.sendMail({
      from: '"Velours Patisserie" <dungusvirginia2@gmail.com>',
      to: 'dungusvirginia2@gmail.com',
      subject: '✨ Test Port 465 SSL Velours Patisserie',
      text: 'Test Port 465 SSL SUCCESS',
    });
    console.log('PORT 465 SUCCESS:', info.messageId);
  } catch (err) {
    console.error('PORT 465 ERROR:', err);
  }
}

testPort465();
