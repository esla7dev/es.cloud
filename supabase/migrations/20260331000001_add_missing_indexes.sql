-- Add missing indexes on foreign-key and filter columns
-- business_notes
CREATE INDEX IF NOT EXISTS idx_business_notes_user_id
  ON business_notes (user_id);

CREATE INDEX IF NOT EXISTS idx_business_notes_business_result_id
  ON business_notes (business_result_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id
  ON tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON tasks (due_date);

-- interaction_status_history
CREATE INDEX IF NOT EXISTS idx_interaction_status_history_interaction_id
  ON interaction_status_history (interaction_id);

-- business_result_tags
CREATE INDEX IF NOT EXISTS idx_business_result_tags_business_result_id
  ON business_result_tags (business_result_id);
