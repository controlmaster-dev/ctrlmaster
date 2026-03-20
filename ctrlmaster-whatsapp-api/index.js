const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors()); // Permitir peticiones desde Vercel (la app principal)

// Inicializar cliente de WhatsApp con guardado de sesión local (para no escanear el QR cada vez)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// Evento: Generar QR para escanear
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('¡ESCANEA ESTE QR CON TU WHATSAPP (Dispositivos vinculados)!');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

// Evento: Cliente autenticado y listo
client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp autenticado y listo para enviar mensajes.');
});

// Evento: Autenticación fallida
client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
});

// Evento: Desconectado
client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
    // Reiniciar cliente de ser necesario
    client.initialize();
});

// ------------ RUTAS API REST ------------

// Endpoint de prueba (Healthcheck)
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API de WhatsApp funcionando' });
});

// Endpoint principal para enviar mensajes
app.post('/api/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    // Validaciones básicas
    if (!phone || !message) {
        return res.status(400).json({ error: 'Faltan parámetros: phone y message son requeridos.' });
    }

    try {
        // Formatear el número de teléfono para WhatsApp (añadir @c.us)
        // Ejemplo de número esperado en variables: 5215555555555
        const number = `${phone}@c.us`; 
        
        // Enviar el mensaje usando cliente alojado localmente
        const response = await client.sendMessage(number, message);
        console.log(`📩 Mensaje enviado a ${phone}`);
        
        res.status(200).json({ success: true, response });
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar cliente de WhatsApp
console.log('Inicializando cliente de WhatsApp...');
client.initialize();

// Iniciar servidor Express
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor API de WhatsApp corriendo en el puerto ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
});
