-- Drop old constraint if exists (cliente_id, source_system)
ALTER TABLE client_integrations DROP CONSTRAINT IF EXISTS client_integrations_cliente_id_source_system_key;

-- Add unique constraint: 1 integration per client max
ALTER TABLE client_integrations ADD CONSTRAINT unique_active_integration_per_client UNIQUE (cliente_id);