/**
 * Script one-shot: șterge toate produsele demo din baza de date.
 * Rulare: npx ts-node scripts/delete-demo-products.ts
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

  // Stergem produsele
  const result = await ds.query(
    `DELETE FROM products RETURNING id, code`
  );

  if (result.length === 0) {
    console.log('✅ Nu există produse de șters.');
  } else {
    console.log(`✅ S-au șters ${result.length} produse demo:`);
    result.forEach((r: { id: string; code: string }) => console.log(`   - [${r.id}] ${r.code}`));
  }

  const totalProducts = await ds.query('SELECT COUNT(*) as total FROM products');
  console.log(`\n📊 Total produse rămase în baza de date: ${totalProducts[0].total}`);

  await ds.destroy();
  console.log('Deconectat. Script finalizat.');
}

main().catch((err) => {
  console.error('❌ Eroare la rularea scriptului:', err.message);
  process.exit(1);
});
