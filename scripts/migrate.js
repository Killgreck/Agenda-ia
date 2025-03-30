// Simple migration script
const { db } = require('../server/db');
const { migrate } = require('drizzle-orm/postgres/migrator');

// Run migrations
async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch(e => {
  console.error('Migration failed:');
  console.error(e);
  process.exit(1);
});