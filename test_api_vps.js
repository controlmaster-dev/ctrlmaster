const axios = require('axios');

const USER_TOKEN = 'dthings_23cdbee1c4bfe3d77ed27daa7aa0c92745e357e4330e7b9c';
const BOT_ID = '1403587679194710036'; // Neph Bot ID from .env
const API_URL = `https://discordthings.us/api/bots/${BOT_ID}/stats`;

console.log(`🚀 Probando API Stats para Bot ID: ${BOT_ID}`);
console.log(`📍 Endpoint: ${API_URL}`);
console.log(`🔑 Token: ${USER_TOKEN.substring(0, 15)}...`);

async function testApi() {
    try {
        const payload = {
            server_count: 500 + Math.floor(Math.random() * 100), // Random count to see change
            shard_count: 5
        };

        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': USER_TOKEN
            }
        });

        console.log('\n✅ ¡ÉXITO! Respuesta del servidor:');
        console.log(response.data);

    } catch (error) {
        console.error('\n❌ ERROR en la petición:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testApi();
