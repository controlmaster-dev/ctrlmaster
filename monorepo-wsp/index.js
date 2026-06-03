const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('¡ESCANEA ESTE QR CON TU WHATSAPP (Dispositivos vinculados)!');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp autenticado y listo para enviar mensajes.');
});

client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
    client.initialize();
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API de WhatsApp funcionando' });
});

app.post('/api/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Faltan parámetros: phone y message son requeridos.' });
    }

    try {
        const number = `${phone}@c.us`;

        const response = await client.sendMessage(number, message);
        console.log(`📩 Mensaje enviado a ${phone}`);

        res.status(200).json({ success: true, response });
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

console.log('Inicializando cliente de WhatsApp...');
client.initialize();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor API de WhatsApp corriendo en el puerto ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
});
