const db = require('./server/database.cjs');

db.serialize(() => {
    // Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS for ADD COLUMN easily, 
    // so we'll wrap in try/catch or just run it and ignore errors in a real migration, 
    // but here we are dropping for clean state as verified previously this is acceptable dev workflow)

    db.run("DROP TABLE IF EXISTS bots", () => {
        db.run(`CREATE TABLE IF NOT EXISTS bots (
            id TEXT PRIMARY KEY,
            name TEXT,
            shortDesc TEXT,
            description TEXT,
            prefix TEXT,
            inviteUrl TEXT,
            ownerId TEXT,
            status TEXT DEFAULT 'pending', 
            votes INTEGER DEFAULT 0,
            tags TEXT,
            avatar TEXT,
            bannerUrl TEXT,
            supportUrl TEXT,
            websiteUrl TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(ownerId) REFERENCES users(id)
          )`, () => {
            console.log("Re-created bots table with banner support.");

            // SEED
            const stmt = db.prepare("INSERT OR REPLACE INTO bots (id, name, shortDesc, description, prefix, votes, tags, status, avatar, bannerUrl, supportUrl, websiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            stmt.run("101", "Birthday Bot", "Keep users engaged and entertained with fun and interactive questions.", "<h1>Birthday Bot</h1><p>Description...</p>", "!", 33000000, "Utility,Fun", "approved", "0", "https://i.imgur.com/exampleBanner.jpg", "https://discord.gg/support", "https://birthdaybot.io");

            stmt.run("102", "Would You", "Challenge your friends with intriguing dilemmas.", "<h1>Would You</h1>", "?", 29000000, "Fun,Games", "approved", "0", "https://placehold.co/1200x400/FF4500/FFFFFF?text=Would+You+Banner", "https://discord.gg/wouldyou", null);

            stmt.finalize();
            console.log("Seeded bots with banners.");
        });
    });
});
