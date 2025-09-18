-- Seed Content Creator Templates
-- Run this directly in Railway PostgreSQL database

-- Insert About Us template
INSERT INTO content_templates (
  template_id, name, description, category, icon,
  input_fields, prompt_template, output_structure,
  default_settings, estimated_words, difficulty, sort_order, is_active
) VALUES (
  'about-us',
  'About Us Page',
  'Professional company introduction and story',
  'website',
  '🏢',
  '[
    {
      "name": "companyName",
      "type": "text",
      "label": "Company Name",
      "placeholder": "e.g., TechCorp Solutions",
      "required": true
    },
    {
      "name": "industry",
      "type": "text",
      "label": "Industry",
      "placeholder": "e.g., Software Development",
      "required": true
    },
    {
      "name": "mission",
      "type": "textarea",
      "label": "Mission Statement",
      "placeholder": "What does your company do and why?",
      "required": true
    }
  ]',
  'Create a professional about us page for {companyName}, a {industry} company. Include their mission: {mission}. Write in a professional tone.',
  '[
    {"id": "hero", "name": "Hero Section", "type": "heading", "content": "", "editable": true, "order": 1},
    {"id": "story", "name": "Company Story", "type": "paragraph", "content": "", "editable": true, "order": 2},
    {"id": "mission", "name": "Mission Statement", "type": "paragraph", "content": "", "editable": true, "order": 3}
  ]',
  '{"temperature": 0.7, "tone": "professional", "style": "detailed", "audience": "general"}',
  800,
  'beginner',
  1,
  true
) ON CONFLICT (template_id) DO NOTHING;

-- Insert Product Description template
INSERT INTO content_templates (
  template_id, name, description, category, icon,
  input_fields, prompt_template, output_structure,
  default_settings, estimated_words, difficulty, sort_order, is_active
) VALUES (
  'product-description',
  'Product Description',
  'Compelling product descriptions that convert',
  'ecommerce',
  '📦',
  '[
    {
      "name": "productName",
      "type": "text",
      "label": "Product Name",
      "placeholder": "e.g., Wireless Headphones Pro",
      "required": true
    },
    {
      "name": "features",
      "type": "textarea",
      "label": "Key Features",
      "placeholder": "List main features (comma-separated)",
      "required": true
    },
    {
      "name": "targetAudience",
      "type": "text",
      "label": "Target Audience",
      "placeholder": "e.g., Music professionals, Gamers",
      "required": true
    }
  ]',
  'Create a compelling product description for {productName}. Key features: {features}. Target audience: {targetAudience}. Make it persuasive and highlight benefits.',
  '[
    {"id": "title", "name": "Product Title", "type": "heading", "content": "", "editable": true, "order": 1},
    {"id": "description", "name": "Main Description", "type": "paragraph", "content": "", "editable": true, "order": 2},
    {"id": "features", "name": "Features List", "type": "list", "content": "", "editable": true, "order": 3}
  ]',
  '{"temperature": 0.8, "tone": "persuasive", "style": "engaging", "audience": "consumers"}',
  300,
  'beginner',
  2,
  true
) ON CONFLICT (template_id) DO NOTHING;

-- Insert Blog Post template
INSERT INTO content_templates (
  template_id, name, description, category, icon,
  input_fields, prompt_template, output_structure,
  default_settings, estimated_words, difficulty, sort_order, is_active
) VALUES (
  'blog-post',
  'Blog Post',
  'Engaging blog posts for your audience',
  'content',
  '📝',
  '[
    {
      "name": "topic",
      "type": "text",
      "label": "Blog Topic",
      "placeholder": "e.g., 10 Tips for Better Productivity",
      "required": true
    },
    {
      "name": "audience",
      "type": "text",
      "label": "Target Audience",
      "placeholder": "e.g., Small business owners",
      "required": true
    },
    {
      "name": "keyPoints",
      "type": "textarea",
      "label": "Key Points to Cover",
      "placeholder": "List main points (comma-separated)",
      "required": true
    }
  ]',
  'Write an engaging blog post about {topic} for {audience}. Cover these key points: {keyPoints}. Make it informative and actionable.',
  '[
    {"id": "title", "name": "Blog Title", "type": "heading", "content": "", "editable": true, "order": 1},
    {"id": "intro", "name": "Introduction", "type": "paragraph", "content": "", "editable": true, "order": 2},
    {"id": "body", "name": "Main Content", "type": "paragraph", "content": "", "editable": true, "order": 3},
    {"id": "conclusion", "name": "Conclusion", "type": "paragraph", "content": "", "editable": true, "order": 4}
  ]',
  '{"temperature": 0.7, "tone": "friendly", "style": "engaging", "audience": "general"}',
  1200,
  'intermediate',
  3,
  true
) ON CONFLICT (template_id) DO NOTHING;

-- Verify insertion
SELECT template_id, name, description, category FROM content_templates ORDER BY sort_order;
