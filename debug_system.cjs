require('dotenv').config();
const db = require('./server/database.cjs');

console.log("Checking Environment...");
if (process.env.DISCORD_BOT_TOKEN) {
    console.log("✅ DISCORD_BOT_TOKEN is present.");
} else {
    console.log("❌ DISCORD_BOT_TOKEN is MISSING.");
}

console.log("\nChecking Database...");
db.all("SELECT * FROM bots", [], (err, rows) => {
    if (err) {
        console.error("❌ DB Error:", err.message);
    } else {
        console.log(`✅ Found ${rows.length} bots in DB.`);
        rows.forEach(bot => {
            console.log(` - [${bot.id}] ${bot.name} (Status: ${bot.status})`);
        });
    }
});
