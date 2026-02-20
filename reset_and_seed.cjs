const db = require('./server/database.cjs');

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS bots", (err) => {
        if (err) console.error(err);
        else console.log("Dropped bots table.");
    });

    // Re-create it (server/database.cjs runs on require, so it might have already tried, 
    // but the Schema change only applies if the table is created new. 
    // Since I can't trigger the create statement inside database.cjs easily without restarting,
    // I'll manually run the CREATE statement here with the new Schema).
    db.run(`CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT,
        shortDesc TEXT,
        description TEXT,
        prefix TEXT,
        inviteUrl TEXT,
        ownerId TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, declined
        votes INTEGER DEFAULT 0,
        tags TEXT,
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ownerId) REFERENCES users(id)
      )`, () => {
        console.log("Re-created bots table.");

        // NOW SEED
        const stmt = db.prepare("INSERT OR REPLACE INTO bots (id, name, shortDesc, description, prefix, votes, tags, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run("101", "Birthday Bot", "Track member birthdays.", "<h1>Birthday Bot</h1><p>Description...</p>", "!", 33000000, "Utility", "approved", "0");
        stmt.run("102", "Would You", "Engaging questions.", "<h1>Would You</h1>", "?", 29000000, "Fun", "approved", "0");
        stmt.finalize();
        console.log("Seeded bots.");
    });
});
