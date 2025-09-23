import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();

const ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: ORIGIN }));
app.use(express.json());
// Loguea método y ruta de cada request
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});
// Responde preflights OPTIONS con CORS
app.options('*', cors());

// Health check
app.get('/', (req, res) => res.json({ ok: true, service: 'appsamedida-api' }));

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL (Gmail)
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
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
    // opcional, útil en dev:
    await transporter.verify();

    const FROM = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const to = process.env.MAIL_TO || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `Apps a Medida <${FROM}>`,
      to,
      subject: `Nueva consulta de ${nombre}`,
      replyTo: email,
      text: `Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono || '-'}\n\nMensaje:\n${mensaje}`,
    });

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