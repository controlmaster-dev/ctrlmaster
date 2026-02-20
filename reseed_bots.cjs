const db = require('./server/database.cjs');

// Insert Mock Bots for Testing Profile
db.serialize(() => {
    const stmt = db.prepare("INSERT OR REPLACE INTO bots (id, name, shortDesc, description, votes, tags, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    // Birthday Bot
    stmt.run("102", "Birthday Bot", "Track member birthdays and roles.", "<h1>Birthday Bot</h1><p>The best bot for birthdays!</p>", 33100000, "Utility", "approved", "0");

    // Would You
    stmt.run("101", "Would You", "Keep users engaged.", "<h1>Would You</h1><p>Fun questions.</p>", 29400000, "Fun", "approved", "0");

    stmt.finalize();
    console.log("Reseeded 2 bots.");
});
