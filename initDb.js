const fs = require('fs');
const path = require('path');
const db = require('./db');

const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL statements (important!)
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length);

    for (const stmt of statements) {
      await db.query(stmt);
    }

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
};

module.exports = initDb;
