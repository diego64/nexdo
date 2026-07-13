CREATE TABLE IF NOT EXISTS tasks_history (
  id         SERIAL PRIMARY KEY,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  old_status task_status NOT NULL,
  new_status task_status NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_history_task_changed
  ON tasks_history(task_id, changed_at DESC);
