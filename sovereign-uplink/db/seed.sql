-- 1. Insert Membership Categories
INSERT INTO membership_type (code, name) VALUES ('NATIVE', 'Space Native');

INSERT INTO membership_category (code, name, principal_category_type, membership_type_id) VALUES 
('FOUNDING', 'Founding Member', 'RESOURCEFUL', 1),
('ORDINARY', 'Ordinary Member', 'RESOURCEFUL', 1),
('SEED_NATIVE', 'Seed Space Native', 'SEED', 1),
('YOUTH', 'Youth Member', 'RESOURCEFUL', 1),
('HONORARY', 'Honorary Member', 'RESOURCEFUL', 1);

-- 2. Insert Official Sovereign Ranks (In Order)
INSERT INTO rank (code, name, rank_order) VALUES 
('M', 'Mentee', 1),
('JM', 'Junior Mentor', 2),
('SM', 'Senior Mentor', 3),
('JAAO', 'Junior Assistant Authenticating Officer', 4),
('SAAO', 'Senior Assistant Authenticating Officer', 5),
('AO', 'Authenticating Officer', 6),
('CAO', 'Chief Authenticating Officer', 7),
('CG.SNR.', 'Chief In General Senior', 8),
('ARCHON', 'Archon (Supreme)', 9);

-- 3. Insert Specific Recognitions
INSERT INTO recognition (code, name, is_lifetime) VALUES 
('BLD', 'The Builder', true),
('TRT', 'The Trustee', true),
('PTP', 'The Philanthropist', true),
('ORIGIN', 'Origin Founder', true);

INSERT INTO membership_status (code, description) VALUES ('ACTIVE', 'Member is in good standing');

-- 4. Initial Bootstrap Admin (The Lead Engineer)
INSERT INTO person (user_name, official_name, sovereign_name) 
VALUES ('ARCHAN_SUPREME', 'Michael Audi', 'Archantilani Ntilanima Archantima');

-- Link the admin to the Rank and Category using safe subqueries
INSERT INTO person_membership (person_id, membership_category_id, membership_status_id, start_date)
VALUES (
    (SELECT id FROM person WHERE user_name = 'ARCHAN_SUPREME'), 
    (SELECT id FROM membership_category WHERE code = 'FOUNDING'), -- Safe lookup
    (SELECT id FROM membership_status WHERE code = 'ACTIVE'),      -- Safe lookup
    NOW()
);

INSERT INTO person_rank (person_id, rank_id, assigned_by_decision_id, start_date)
VALUES (
    (SELECT id FROM person WHERE user_name = 'ARCHAN_SUPREME'), 
    (SELECT id FROM rank WHERE code = 'ARCHON'), 
    uuid_generate_v4(), 
    NOW()
);

-- 5. Assign initial recognitions to the admin
INSERT INTO person_recognition (person_id, recognition_id, awarded_by, award_reason, start_date)
SELECT 
    (SELECT id FROM person WHERE user_name = 'ARCHAN_SUPREME'),
    id,
    'SYSTEM_BOOTSTRAP',
    'Founding Sovereign Identity',
    NOW()
FROM recognition 
WHERE code IN ('BLD', 'TRT', 'PTP', 'ORIGIN');

-- 6. Initialize Admin Security (Mandatory for Login)
INSERT INTO person_security (person_id, primary_ip_binding, security_clearance)
VALUES (
    (SELECT id FROM person WHERE user_name = 'ARCHAN_SUPREME'),
    '127.0.0.1', -- Or your specific IP binding
    10           -- Level 10 Clearance for Archon
);