const db = require('./server/database.cjs');

db.run("DELETE FROM bots", function (err) {
    if (err) return console.error(err.message);
    console.log(`Deleted ${this.changes} bots from the database.`);
});
