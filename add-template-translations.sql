-- Add Lithuanian translations to content templates
-- Run this SQL in your Supabase SQL Editor

-- Example: Update "About Us Page" template with Lithuanian translation
UPDATE content_templates
SET translations = jsonb_set(
  COALESCE(translations, '{}'::jsonb),
  '{lt}',
  '{
    "name": "Apie mus puslapis",
    "description": "Sukurkite profesionalų ''Apie mus'' puslapį su įmonės istorija, misija ir vertybėmis",
    "inputFields": [
      {
        "name": "companyName",
        "type": "text",
        "label": "Įmonės pavadinimas",
        "placeholder": "Pvz., TechCorp Solutions",
        "required": true
      },
      {
        "name": "industry",
        "type": "text",
        "label": "Pramonės šaka",
        "placeholder": "Pvz., Technologijos, Sveikata, Finansai",
        "required": false
      },
      {
        "name": "foundedYear",
        "type": "text",
        "label": "Įkūrimo metai",
        "placeholder": "Pvz., 2020",
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
      }
    ]
  }'::jsonb
)
WHERE name = 'About Us Page';

-- Example: Update "Product Description" template
UPDATE content_templates
SET translations = jsonb_set(
  COALESCE(translations, '{}'::jsonb),
  '{lt}',
  '{
    "name": "Produkto aprašymas",
    "description": "Sukurkite patrauklų produkto aprašymą, pabrėžiantį naudą ir savybes",
    "inputFields": [
      {
        "name": "productName",
        "type": "text",
        "label": "Produkto pavadinimas",
        "placeholder": "Pvz., Premium Wireless Headphones",
        "required": true
      },
      {
        "name": "category",
        "type": "text",
        "label": "Kategorija",
        "placeholder": "Pvz., Elektronika, Mada, Namai",
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
        "placeholder": "Pvz., Profesionalai, Studentai, Šeimos",
        "required": false
      }
    ]
  }'::jsonb
)
WHERE name = 'Product Description';

-- Add more templates as needed...
-- You can check existing templates with:
-- SELECT template_id, name, description FROM content_templates WHERE is_active = true;

