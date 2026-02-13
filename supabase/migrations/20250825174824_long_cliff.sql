/*
  # Add separate offer and follow-up template fields to campaigns

  1. New Columns
    - `default_offer_template_id` (uuid, nullable)
      - Foreign key reference to message_templates(id)
      - Stores the default offer template for the campaign
    - `default_follow_up_template_id` (uuid, nullable)
      - Foreign key reference to message_templates(id)
      - Stores the default follow-up template for the campaign

  2. Constraints
    - Foreign key constraints to ensure template IDs exist
    - ON DELETE SET NULL to handle template deletion gracefully

  3. Indexes
    - Indexes on both template ID columns for better query performance

  4. Migration Notes
    - Removes the old single `default_message_template_id` column
    - Adds the two new specific template columns
    - Updates foreign key constraints accordingly
*/

-- Add new template columns
ALTER TABLE campaigns 
ADD COLUMN default_offer_template_id uuid,
ADD COLUMN default_follow_up_template_id uuid;

-- Add foreign key constraints
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_default_offer_template_id 
FOREIGN KEY (default_offer_template_id) 
REFERENCES message_templates(id) ON DELETE SET NULL;

ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_default_follow_up_template_id 
FOREIGN KEY (default_follow_up_template_id) 
REFERENCES message_templates(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_campaigns_default_offer_template_id 
ON campaigns(default_offer_template_id);

CREATE INDEX idx_campaigns_default_follow_up_template_id 
ON campaigns(default_follow_up_template_id);

-- Remove old single template column and its constraints
ALTER TABLE campaigns 
DROP CONSTRAINT IF EXISTS fk_campaigns_default_message_template_id;

DROP INDEX IF EXISTS idx_campaigns_default_message_template_id;

ALTER TABLE campaigns 
DROP COLUMN IF EXISTS default_message_template_id;