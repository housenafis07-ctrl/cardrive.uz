# Admin order editing

Manager corrections are stored as order-level overrides in `orders.manager_overrides`; shared car, profile, bank and financing-program records are not modified. `last_edited_by` and `last_edited_at` identify the latest editor. Each actual field change is recorded in `audit_logs` with old and new values under `order.manager_edited`.
