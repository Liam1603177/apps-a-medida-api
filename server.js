import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();
const app = express();

// CORS (lista separada por comas)
const ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => (!origin || ORIGINS.includes('*') || ORIGINS.includes(origin)) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.options('*', cors());

app.use(express.json());

// Log simple
app.use((req,res,next)=>{ console.log(req.method, req.path); next(); });

// Healthcheck
app.get('/', (req, res) => res.json({ ok: true, service: 'appsamedida-api' }));

// Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Contact endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje, _honey } = req.body || {};
    if (_honey) return res.status(200).json({ ok: true, spam: true });
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });
    }

    if (!resend) {
      console.error('RESEND_API_KEY no configurada');
      return res.status(500).json({ ok: false, error: 'Servicio de correo no configurado' });
    }

    const from = `Apps a Medida <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;
    const to = process.env.MAIL_TO;

    const result = await resend.emails.send({
      from,
      to,
      reply_to: email,
      subject: `Nueva consulta de ${nombre}`,
      text:
`Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono || '-'}
Mensaje:
${mensaje}`
    });

    return res.json({ ok: true, id: result.data?.id || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Error al enviar el email' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));