import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';

const app = express();
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('فشل تهيئة Firebase:', error);
  process.exit(1);
}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || '*';
app.use(cors({
  origin: allowedOrigins,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.post('/send', async (req, res) => {
  try {
    const { token, title, body } = req.body;
    
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'بيانات ناقصة: token، title، body مطلوبة'
      });
    }

    const message = {
      data: {
        title,
        body,
        timestamp: Date.now().toString()
      },
      token
    };

    const response = await admin.messaging().send(message);
    
    console.log('تم الإرسال بنجاح:', response);
    res.json({
      success: true,
      messageId: response
    });

  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطأ داخلي في الخادم'
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`الخادم يعمل على المنفذ ${port}`);
});
