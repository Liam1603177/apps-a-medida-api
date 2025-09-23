# appsamedida-api
API mínima (Express + Nodemailer) para el formulario de contacto del landing.

## Uso rápido
```bash
npm install
cp .env.example .env   # completá SMTP y MAIL_TO
npm run start          # http://localhost:4000
```

### Endpoint
- `POST /api/contact` (JSON)
```json
{
  "nombre": "Juan",
  "email": "juan@mail.com",
  "telefono": "291...",
  "mensaje": "Hola, necesito una web",
  "_honey": ""         // honeypot (dejar vacío)
}
```
