import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.ecwpwmsqanlatfntzoul:j7PLA9pc0FOvi20U@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addTranslations() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // 1. About Us Page
    console.log('📝 Adding translation for About Us Page...');
    await client.query(`
      UPDATE content_templates
      SET translations = '{
        "lt": {
          "name": "Apie mus puslapis",
          "description": "Profesionalus įmonės pristatymas ir istorija",
          "inputFields": [
            {
              "name": "companyName",
              "type": "text",
              "label": "Įmonės pavadinimas",
              "placeholder": "pvz., TechCorp Solutions",
              "required": true
            },
            {
              "name": "industry",
              "type": "text",
              "label": "Pramonės šaka",
              "placeholder": "pvz., Programinės įrangos kūrimas, Rinkodara, Sveikatos priežiūra",
              "required": true
            },
            {
              "name": "foundedYear",
              "type": "number",
              "label": "Įkūrimo metai",
              "placeholder": "2020",
              "required": false
            },
            {
              "name": "mission",
              "type": "textarea",
              "label": "Misija/Tikslas",
              "placeholder": "Ką jūsų įmonė daro ir kodėl?",
              "required": true
            },
            {
              "name": "values",
              "type": "textarea",
              "label": "Pagrindinės vertybės",
              "placeholder": "Išvardykite 3-5 pagrindines įmonės vertybes",
              "required": false
            },
            {
              "name": "teamSize",
              "type": "select",
              "label": "Komandos dydis",
              "placeholder": "Pasirinkite komandos dydį",
              "required": false,
              "options": ["1-5 darbuotojai", "6-20 darbuotojų", "21-50 darbuotojų", "51-200 darbuotojų", "200+ darbuotojų"]
            }
          ]
        }
      }'::jsonb
      WHERE template_id = 'about-us';
    `);
    console.log('✅ About Us translated');

    // 2. Product Description
    console.log('📝 Adding translation for Product Description...');
    await client.query(`
      UPDATE content_templates
      SET translations = '{
        "lt": {
          "name": "Produkto aprašymas",
          "description": "Patrauklūs produktų aprašymai, kurie konvertuoja",
          "inputFields": [
            {
              "name": "productName",
              "type": "text",
              "label": "Produkto pavadinimas",
              "placeholder": "pvz., Belaidės Bluetooth ausinės",
              "required": true
            }
          ]
        }
      }'::jsonb
      WHERE template_id = 'product-description';
    `);
    console.log('✅ Product Description translated');

    // 3. Service Description
    console.log('📝 Adding translation for Service Description...');
    await client.query(`
      UPDATE content_templates
      SET translations = '{
        "lt": {
          "name": "Paslaugos aprašymas",
          "description": "Profesionalūs paslaugų aprašymai, kurie kuria pasitikėjimą",
          "inputFields": [
            {
              "name": "serviceName",
              "type": "text",
              "label": "Paslaugos pavadinimas",
              "placeholder": "pvz., Svetainių kūrimas",
              "required": true
            }
          ]
        }
      }'::jsonb
      WHERE template_id = 'service-description';
    `);
    console.log('✅ Service Description translated');

    // 4. Blog Post
    console.log('📝 Adding translation for Blog Post...');
    await client.query(`
      UPDATE content_templates
      SET translations = '{
        "lt": {
          "name": "Tinklaraščio įrašas",
          "description": "Įtraukiantys tinklaraščio įrašai, kurie informuoja ir įtraukia",
          "inputFields": [
            {
              "name": "title",
              "type": "text",
              "label": "Tinklaraščio įrašo pavadinimas",
              "placeholder": "pvz., 10 patarimų geresniam produktyvumui",
              "required": true
            }
          ]
        }
      }'::jsonb
      WHERE template_id = 'blog-post';
    `);
    console.log('✅ Blog Post translated');

    // 5. Landing Page
    console.log('📝 Adding translation for Landing Page...');
    await client.query(`
      UPDATE content_templates
      SET translations = '{
        "lt": {
          "name": "Nusileidimo puslapis",
          "description": "Aukšto konversijos nusileidimo puslapiai kampanijoms",
          "inputFields": [
            {
              "name": "productService",
              "type": "text",
              "label": "Produkto/Paslaugos pavadinimas",
              "placeholder": "pvz., El. pašto rinkodaros kursas",
              "required": true
            }
          ]
        }
      }'::jsonb
      WHERE template_id = 'landing-page';
    `);
    console.log('✅ Landing Page translated');

    // Verify
    console.log('\n📊 Verifying translations...');
    const result = await client.query(`
      SELECT 
        template_id,
        name,
        translations->'lt'->>'name' as lithuanian_name,
        CASE 
          WHEN translations->'lt' IS NOT NULL THEN '✅ Has Lithuanian'
          ELSE '❌ Missing Lithuanian'
        END as translation_status
      FROM content_templates
      WHERE is_active = true
      ORDER BY sort_order;
    `);

    console.log('\n📋 Translation Status:');
    result.rows.forEach(row => {
      console.log(`  ${row.translation_status} ${row.template_id}: ${row.name} → ${row.lithuanian_name || 'N/A'}`);
    });

    console.log('\n🎉 All translations added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addTranslations();

