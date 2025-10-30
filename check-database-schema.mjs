import pg from 'pg'
const { Client } = pg

// Use DATABASE_URL from environment
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkSchema() {
  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check if projects table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      );
    `)
    console.log('📋 Projects table exists:', tableCheck.rows[0].exists)

    if (tableCheck.rows[0].exists) {
      // Get columns of projects table
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'projects'
        ORDER BY ordinal_position;
      `)
      
      console.log('\n📊 Projects table columns:')
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
      })
      
      // Check if admin_id column exists
      const hasAdminId = columns.rows.some(col => col.column_name === 'admin_id')
      console.log('\n🔍 Has admin_id column:', hasAdminId)
    }

    // Check users table
    console.log('\n👤 Checking users table...')
    const users = await client.query('SELECT id, email, name, github_username FROM users LIMIT 5')
    console.log(`Found ${users.rows.length} users:`)
    users.rows.forEach(user => {
      console.log(`  - ${user.email || user.github_username || 'No email'} (ID: ${user.id})`)
    })

    // Check user_roles table
    console.log('\n🔐 Checking user_roles table...')
    const userRolesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_roles'
      );
    `)
    
    if (userRolesExists.rows[0].exists) {
      const roles = await client.query('SELECT * FROM user_roles')
      console.log(`Found ${roles.rows.length} role assignments:`)
      roles.rows.forEach(role => {
        console.log(`  - User ${role.user_id}: ${role.role}`)
      })
    } else {
      console.log('❌ user_roles table does not exist')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkSchema()

