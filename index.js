import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';

const app = express();
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// تخزين مؤقت لـ FCM Tokens (يمكن استبداله بقاعدة بيانات حقيقية)
const userTokens = new Map();  // { userId: fcmToken }

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

// 1. نقطة نهاية لتسجيل التوكنات
app.post('/register-token', (req, res) => {
  const { userId, fcmToken } = req.body;
  
  if (!userId || !fcmToken) {
    return res.status(400).json({
      success: false,
      error: 'المعلومات ناقصة: userId و fcmToken مطلوبة'
    });
  }

  userTokens.set(userId, fcmToken);
  res.json({ success: true });
});

// 2. إرسال الإشعارات
app.post('/send', async (req, res) => {
  try {
    const { token, title, body, sender_id } = req.body;
    
    if (!token || !title || !body || !sender_id) {
      return res.status(400).json({
        success: false,
        error: 'المعلومات ناقصة: token، title، body، sender_id مطلوبة'
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
    res.json({ success: true, messageId: response });

  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطأ داخلي في الخادم'
    });
  }
});

// 3. معالجة الردود
app.post('/reply', async (req, res) => {
  try {
    const { sender_id, reply } = req.body;

    if (!sender_id || !reply) {
      return res.status(400).json({
        success: false,
        error: 'المعلومات ناقصة: sender_id و reply مطلوبة'
      });
    }

    // الحصول على توكن المرسل من التخزين المؤقت
    const userToken = userTokens.get(sender_id);

    if (!userToken) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على توكن المرسل'
      });
    }

    // إرسال إشعار الرد
    const replyMessage = {
      data: {
        title: "رد جديد",
        body: reply,
        type: "reply"
      },
      token: userToken
    };

    const response = await admin.messaging().send(replyMessage);
    res.json({ success: true, messageId: response });

  } catch (error) {
    console.error('خطأ في معالجة الرد:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطأ داخلي في الخادم'
    });
  }
});

// تشغيل الخادم
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`الخادم يعمل على المنفذ ${port}`);
});
