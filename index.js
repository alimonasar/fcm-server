import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    notification: { title, body },
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
