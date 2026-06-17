const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'shega_desktop.db');

try {
  const db = new Database(dbPath, { readonly: true });
  console.log(`Checking DB at: ${dbPath}`);
  
  const columns = db.prepare("PRAGMA table_info(businesses)").all();
  console.log("Businesses columns:");
  columns.forEach(c => console.log(` - ${c.name} (${c.type})`));
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables found:", tables.map(t => t.name).join(', '));
  
  // Check if there is at least one business
  const bizCount = db.prepare("SELECT count(*) as count FROM businesses").get().count;
  console.log(`Businesses count: ${bizCount}`);
  
  db.close();
} catch (err) {
  console.log(`Error: ${err.message}`);
}
