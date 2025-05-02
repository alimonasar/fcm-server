import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('/etc/secrets/service-account.json', 'utf8')
);

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    data: { // استبدال notification بـ data
      title: title,
      body: body,
      // يمكن إضافة حقول إضافية هنا
    },
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});
