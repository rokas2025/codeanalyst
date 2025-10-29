#!/usr/bin/env node

import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

async function checkSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check users table structure
    console.log('📋 Users table structure:');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.table(usersColumns.rows);

    // Check existing user
    console.log('\n👤 Existing rokas@zubas.lt user:');
    const user = await client.query(`SELECT * FROM users WHERE email = 'rokas@zubas.lt';`);
    console.table(user.rows);

    // Check all tables
    console.log('\n📊 All tables in database:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.table(tables.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();

