-- Add Lithuanian translations for all content templates
-- Run this in Supabase SQL Editor

-- 1. About Us Page
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

-- 2. Product Description
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
      },
      {
        "name": "category",
        "type": "text",
        "label": "Kategorija",
        "placeholder": "pvz., Elektronika, Mada, Namai",
        "required": false
      },
      {
        "name": "features",
        "type": "textarea",
        "label": "Pagrindinės savybės",
        "placeholder": "Išvardykite pagrindines produkto savybes",
        "required": true
      },
      {
        "name": "benefits",
        "type": "textarea",
        "label": "Nauda klientui",
        "placeholder": "Kaip šis produktas padeda klientui?",
        "required": true
      },
      {
        "name": "targetAudience",
        "type": "text",
        "label": "Tikslinė auditorija",
        "placeholder": "pvz., Profesionalai, Studentai, Šeimos",
        "required": false
      }
    ]
  }
}'::jsonb
WHERE template_id = 'product-description';

-- 3. Service Description
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
      },
      {
        "name": "serviceType",
        "type": "text",
        "label": "Paslaugos tipas",
        "placeholder": "pvz., Konsultacijos, Įgyvendinimas, Palaikymas",
        "required": false
      },
      {
        "name": "benefits",
        "type": "textarea",
        "label": "Pagrindinės naudos",
        "placeholder": "Kokią naudą gauna klientai?",
        "required": true
      },
      {
        "name": "process",
        "type": "textarea",
        "label": "Procesas",
        "placeholder": "Kaip teikiama paslauga?",
        "required": false
      },
      {
        "name": "targetClient",
        "type": "text",
        "label": "Tiksliniai klientai",
        "placeholder": "pvz., Mažos įmonės, Startuoliai, Įmonės",
        "required": false
      }
    ]
  }
}'::jsonb
WHERE template_id = 'service-description';

-- 4. Blog Post
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
      },
      {
        "name": "topic",
        "type": "text",
        "label": "Tema",
        "placeholder": "pvz., Produktyvumas, Technologijos, Verslas",
        "required": true
      },
      {
        "name": "keyPoints",
        "type": "textarea",
        "label": "Pagrindiniai taškai",
        "placeholder": "Apie ką norite rašyti?",
        "required": true
      },
      {
        "name": "targetAudience",
        "type": "text",
        "label": "Tikslinė auditorija",
        "placeholder": "pvz., Verslininkai, Studentai, Profesionalai",
        "required": false
      },
      {
        "name": "callToAction",
        "type": "text",
        "label": "Kvietimas veikti",
        "placeholder": "pvz., Prenumeruokite, Pasidalinkite, Komentuokite",
        "required": false
      }
    ]
  }
}'::jsonb
WHERE template_id = 'blog-post';

-- 5. Landing Page
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
      },
      {
        "name": "mainBenefit",
        "type": "text",
        "label": "Pagrindinė nauda",
        "placeholder": "Kokia yra pagrindinė nauda?",
        "required": true
      },
      {
        "name": "targetProblem",
        "type": "textarea",
        "label": "Tikslinė problema",
        "placeholder": "Kokią problemą tai sprendžia?",
        "required": true
      },
      {
        "name": "features",
        "type": "textarea",
        "label": "Pagrindinės savybės",
        "placeholder": "Išvardykite 3-5 pagrindines savybes",
        "required": true
      },
      {
        "name": "offer",
        "type": "text",
        "label": "Pasiūlymas",
        "placeholder": "pvz., Nemokamas bandomasis laikotarpis, Nuolaida 50%",
        "required": false
      },
      {
        "name": "urgency",
        "type": "text",
        "label": "Skubumas",
        "placeholder": "pvz., Ribotas laikas, Tik 10 vietų",
        "required": false
      }
    ]
  }
}'::jsonb
WHERE template_id = 'landing-page';

-- Verify translations were added
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

