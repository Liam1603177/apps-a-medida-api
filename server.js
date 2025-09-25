
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();


const ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGINS.includes('*') || ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// preflight para cualquier ruta
app.options('*', cors());

app.use(express.json());

// (debug opcional)
app.use((req,res,next)=>{ console.log(req.method, req.path); next(); });

// healthcheck
app.get('/', (req,res)=> res.json({ ok:true, service:'appsamedida-api' }));

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // 465=SSL, 587=STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000, // 15s
    greetingTimeout: 10000,   // 10s
    socketTimeout: 20000,     // 20s
    tls: { minVersion: 'TLSv1.2' }
  });

app.post('/api/contact', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje, _honey } = req.body || {};

    // Honeypot spam trap
    if (_honey) return res.status(200).json({ ok: true, spam: true });

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });
    }

    const transporter = createTransporter();
    await transporter.verify();
    const FROM = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const to = process.env.MAIL_TO || process.env.SMTP_USER;
    const mailData = {
      to,
      subject: `Nueva consulta de ${nombre}`,
      replyTo: email,
      text: `Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono || '-'}\n\nMensaje:\n${mensaje}`,
    };
    const info = await transporter.sendMail({ from: `Apps a Medida <${FROM}>`, ...mailData });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Error al enviar el email' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});