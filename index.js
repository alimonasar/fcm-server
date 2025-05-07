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
    // التعديل هنا ↓ (إضافة sender_id)
    const { token, title, body, sender_id } = req.body;
    
    // التعديل هنا ↓ (إضافة تحقق من sender_id)
    if (!token || !title || !body || !sender_id) {
      return res.status(400).json({
        success: false,
        error: 'بيانات ناقصة: token، title، body، sender_id مطلوبة'
      });
    }

    const message = {
      data: {
        title,
        body,
        sender_id,
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
