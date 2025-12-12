-- Create test user with custom_id = root
-- Username: testroot
-- Password: 2503
-- Custom ID: root

INSERT INTO users (username, password_hash, custom_id, created_at) 
VALUES ('testroot', '$2a$10$IQHK6DKrOg/Zkg2t3PileOsQ8tOcw8lTfyc.XCAiVOTSfFq64tidi', 'root', NOW());

-- Verification query:
-- SELECT * FROM users WHERE custom_id = 'root';

-- You can now login with:
-- - Identifier: testroot, Password: 2503
-- - Identifier: root, Password: 2503
