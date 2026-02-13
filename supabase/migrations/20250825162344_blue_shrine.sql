/*
  # Create message templates table

  1. New Tables
    - `message_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text, template name)
      - `type` (text, template type: 'offer' or 'follow_up')
      - `subject` (text, message subject/title)
      - `content` (text, message content with placeholders)
      - `is_default` (boolean, whether this is a default template)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `message_templates` table
    - Add policies for authenticated users to manage their own templates

  3. Default Templates
    - Insert default Arabic templates for offers and follow-ups
*/

CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('offer', 'follow_up')),
  subject text NOT NULL,
  content text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Policies for message templates
CREATE POLICY "Users can view own templates"
  ON message_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON message_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON message_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON message_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Insert default templates (these will be created for each user when they first access templates)
-- We'll handle this in the application code to ensure proper user_id assignment