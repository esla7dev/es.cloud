/*
  # Add country and template support to campaigns

  1. New Columns
    - `target_country_code` (text, required) - stores country dialing code
    - `default_message_template_id` (uuid, optional) - references message_templates.id

  2. Changes
    - Add target_country_code column with default '966' (KSA)
    - Add default_message_template_id column as foreign key to message_templates
    - Add check constraint for supported country codes
*/

-- Add target_country_code column
ALTER TABLE campaigns 
ADD COLUMN target_country_code text NOT NULL DEFAULT '966';

-- Add default_message_template_id column
ALTER TABLE campaigns 
ADD COLUMN default_message_template_id uuid;

-- Add foreign key constraint for message template
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_default_message_template_id 
FOREIGN KEY (default_message_template_id) 
REFERENCES message_templates(id) ON DELETE SET NULL;

-- Add check constraint for supported country codes
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_target_country_code_check 
CHECK (target_country_code IN ('20', '966', '971', '974', '968'));

-- Create index for better performance
CREATE INDEX idx_campaigns_target_country_code ON campaigns(target_country_code);
CREATE INDEX idx_campaigns_default_message_template_id ON campaigns(default_message_template_id);