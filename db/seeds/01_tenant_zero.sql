INSERT INTO tenants (id, name) VALUES ('tenant-0000', 'Demo Tenant');

INSERT INTO users (email, tenant_id) VALUES ('admin@cadviewer.local', 'tenant-0000');

INSERT INTO models (id, tenant_id, name, schema, engine) 
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'tenant-0000', 
    'Granite Monument MVP', 
    '{"type": "object", "properties": {"width": {"type": "number", "minimum": 10, "maximum": 60}}}'::jsonb, 
    'freecad'
);
