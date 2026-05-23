/**
 * Script one-shot: șterge conturile demo/test din baza de date.
 * Rulare: npx ts-node scripts/delete-demo-users.ts
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'distridentmedical',
  });

  await ds.initialize();
  console.log('Conectat la baza de date.');

  const demoEmails = [
    'client@tdsupply.ro',
    'demo@cabinet.ro',
    'test@dental.ro',
  ];

  const result = await ds.query(
    `DELETE FROM users WHERE email = ANY($1::text[]) RETURNING email`,
    [demoEmails],
  );

  if (result.length === 0) {
    console.log('✅ Nu există conturi demo de șters (deja curate sau nu au existat niciodată).');
  } else {
    console.log(`✅ Șters ${result.length} conturi demo:`);
    result.forEach((r: { email: string }) => console.log(`   - ${r.email}`));
  }

  // Șterge și admin-ul de test dev dacă există
  const adminResult = await ds.query(
    `DELETE FROM admins WHERE email = $1 RETURNING email`,
    ['admin@local.test'],
  );
  if (adminResult.length > 0) {
    console.log(`✅ Șters admin de test dev: admin@local.test`);
  }

  const totalUsers = await ds.query('SELECT COUNT(*) as total FROM users');
  console.log(`\n📊 Total utilizatori rămași: ${totalUsers[0].total}`);

  await ds.destroy();
  console.log('Deconectat. Script finalizat.');
}

main().catch((err) => {
  console.error('❌ Eroare:', err.message);
  process.exit(1);
});
