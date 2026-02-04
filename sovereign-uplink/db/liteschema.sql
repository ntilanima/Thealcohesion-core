-- =========================================
-- Thealcohesion-core: SQLite-compatible, full schema
-- Drop all tables first (safe to run on fresh DB)
-- Includes indexes and triggers for performance & integrity
-- =========================================

PRAGMA foreign_keys = OFF;

-- Drop tables in dependency-safe order
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS platform;
DROP TABLE IF EXISTS tenure;
DROP TABLE IF EXISTS person_certification;
DROP TABLE IF EXISTS certification;
DROP TABLE IF EXISTS readiness_pool_assignment;
DROP TABLE IF EXISTS readiness_pool;
DROP TABLE IF EXISTS operational_assignment;
DROP TABLE IF EXISTS operational_role;
DROP TABLE IF EXISTS operational_unit_service;
DROP TABLE IF EXISTS operational_unit;
DROP TABLE IF EXISTS operational_unit_type;
DROP TABLE IF EXISTS ranking_decision;
DROP TABLE IF EXISTS ranking_board_subject;
DROP TABLE IF EXISTS ranking_board_member;
DROP TABLE IF EXISTS ranking_board_session;
DROP TABLE IF EXISTS ranking_board_type;
DROP TABLE IF EXISTS office_assignment;
DROP TABLE IF EXISTS office;
DROP TABLE IF EXISTS tlc_officials;
DROP TABLE IF EXISTS tlc;
DROP TABLE IF EXISTS action_center_officials;
DROP TABLE IF EXISTS action_center;
DROP TABLE IF EXISTS person_mentorship;
DROP TABLE IF EXISTS mentorship_structure;
DROP TABLE IF EXISTS mentorship_structure_type;
DROP TABLE IF EXISTS formation_relationship;
DROP TABLE IF EXISTS formation_officials;
DROP TABLE IF EXISTS subformation;
DROP TABLE IF EXISTS formation;
DROP TABLE IF EXISTS formation_type;
DROP TABLE IF EXISTS person_training;
DROP TABLE IF EXISTS training_program;
DROP TABLE IF EXISTS training_level;
DROP TABLE IF EXISTS person_recognition;
DROP TABLE IF EXISTS recognition;
DROP TABLE IF EXISTS person_rank;
DROP TABLE IF EXISTS rank_hierarchy;
DROP TABLE IF EXISTS rank;
DROP TABLE IF EXISTS person_membership;
DROP TABLE IF EXISTS membership_status;
DROP TABLE IF EXISTS membership_category;
DROP TABLE IF EXISTS membership_type;
DROP TABLE IF EXISTS house_assembly_member;
DROP TABLE IF EXISTS person_security;
DROP TABLE IF EXISTS member_birthright;
DROP TABLE IF EXISTS judicial_panel_member;
DROP TABLE IF EXISTS judicial_session;
DROP TABLE IF EXISTS person_media;
DROP TABLE IF EXISTS person_titles;
DROP TABLE IF EXISTS verification_log;
DROP TABLE IF EXISTS contact_information;
DROP TABLE IF EXISTS address;
DROP TABLE IF EXISTS biometric_data;
DROP TABLE IF EXISTS identity_document;
DROP TABLE IF EXISTS person;

PRAGMA foreign_keys = ON;

-- =========================================
-- Core tables
-- =========================================

CREATE TABLE person (
    id TEXT PRIMARY KEY,
    user_name TEXT,
    official_name TEXT NOT NULL,
    sovereign_name TEXT,
    gender TEXT,
    date_of_birth TEXT,
    country TEXT,
    is_frozen INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_person_country ON person(country);

CREATE TABLE identity_document (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    issue_date TEXT,
    expiry_date TEXT,
    issuing_country TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(document_type, document_number)
);
CREATE INDEX idx_identity_person ON identity_document(person_id);

CREATE TABLE biometric_data (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    data BLOB NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_biometric_person ON biometric_data(person_id);

CREATE TABLE address (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT,
    country TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_address_person ON address(person_id);

CREATE TABLE contact_information (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL,
    contact_value TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_contact_person ON contact_information(person_id);

CREATE TABLE verification_log (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    details TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_verification_person ON verification_log(person_id);

CREATE TABLE person_titles (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_titles_person ON person_titles(person_id);

CREATE TABLE person_media (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    media_type TEXT,
    url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_media_person ON person_media(person_id);

-- =========================================
-- Membership tables
-- =========================================

CREATE TABLE membership_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE membership_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    immutable INTEGER DEFAULT 1,
    membership_type_id INTEGER REFERENCES membership_type(id),
    principal_category_type TEXT CHECK(principal_category_type IN ('RESOURCEFUL','SEED'))
);
CREATE INDEX idx_category_type ON membership_category(principal_category_type);

CREATE TABLE membership_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE person_membership (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    membership_category_id INTEGER REFERENCES membership_category(id),
    membership_status_id INTEGER REFERENCES membership_status(id),
    start_date TEXT NOT NULL,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_membership ON person_membership(person_id);

-- =========================================
-- Rank tables
-- =========================================

CREATE TABLE rank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rank_order INTEGER NOT NULL,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE rank_hierarchy (
    parent_rank_id INTEGER REFERENCES rank(id),
    child_rank_id INTEGER REFERENCES rank(id),
    PRIMARY KEY(parent_rank_id, child_rank_id)
);

CREATE TABLE person_rank (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    rank_id INTEGER REFERENCES rank(id),
    assigned_by_board_session_id TEXT,
    assigned_by_decision_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_rank ON person_rank(person_id);

-- Trigger: prevent SEED members from holding rank
CREATE TRIGGER trg_block_seed_rank
BEFORE INSERT ON person_rank
FOR EACH ROW
BEGIN
    SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM person_membership pm
            JOIN membership_category mc ON pm.membership_category_id = mc.id
            WHERE pm.person_id = NEW.person_id
              AND mc.principal_category_type = 'SEED'
        )
        THEN RAISE(ABORT, 'Seed members cannot hold rank')
    END;
END;

-- =========================================
-- Recognition tables
-- =========================================

CREATE TABLE recognition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    is_lifetime INTEGER,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE person_recognition (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    recognition_id INTEGER REFERENCES recognition(id),
    awarded_by TEXT,
    award_reason TEXT,
    award_reference TEXT,
    start_date TEXT,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_recognition ON person_recognition(person_id);

-- =========================================
-- Training tables
-- =========================================

CREATE TABLE training_level (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    description TEXT,
    level_order INTEGER,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE training_program (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_level_id INTEGER REFERENCES training_level(id),
    name TEXT,
    description TEXT,
    delivery_mode TEXT,
    provider TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_program_level ON training_program(training_level_id);

CREATE TABLE person_training (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    training_program_id INTEGER REFERENCES training_program(id),
    training_level_id INTEGER REFERENCES training_level(id),
    completion_date TEXT,
    verified_by TEXT,
    certificate_reference TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_training ON person_training(person_id);

-- =========================================
-- Formation / Mentorship tables
-- =========================================

CREATE TABLE formation_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    description TEXT,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE formation (
    id TEXT PRIMARY KEY,
    formation_type_id INTEGER REFERENCES formation_type(id),
    code TEXT,
    name TEXT,
    mandate TEXT,
    scope TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_formation_type ON formation(formation_type_id);

CREATE TABLE subformation (
    id TEXT PRIMARY KEY,
    parent_formation_id TEXT REFERENCES formation(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT,
    mandate TEXT,
    scope TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_subformation_parent ON subformation(parent_formation_id);

CREATE TABLE formation_officials (
    id TEXT PRIMARY KEY,
    formation_id TEXT REFERENCES formation(id) ON DELETE CASCADE,
    person_id TEXT REFERENCES person(id),
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_formation_officials ON formation_officials(formation_id, person_id);

CREATE TABLE mentorship_structure_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    description TEXT,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE mentorship_structure (
    id TEXT PRIMARY KEY,
    structure_type_id INTEGER REFERENCES mentorship_structure_type(id),
    name TEXT,
    purpose TEXT,
    formation_scope TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_mentorship_structure_type ON mentorship_structure(structure_type_id);

CREATE TABLE person_mentorship (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    mentorship_structure_id TEXT REFERENCES mentorship_structure(id),
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_mentorship ON person_mentorship(person_id, mentorship_structure_id);

-- =========================================
-- Action Centers & TLCs
-- =========================================

CREATE TABLE action_center (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area_coordinates TEXT,
    area_code TEXT,
    physical_area_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE action_center_officials (
    id TEXT PRIMARY KEY,
    action_center_id TEXT REFERENCES action_center(id) ON DELETE CASCADE,
    person_id TEXT REFERENCES person(id),
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_ac_officials ON action_center_officials(action_center_id, person_id);

CREATE TABLE tlc (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mandate TEXT,
    scope TEXT,
    start_date DATE,
    end_date DATE,
    action_center_id TEXT REFERENCES action_center(id) ON DELETE CASCADE,
    area_coordinates TEXT,
    area_code TEXT,
    physical_area_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tlc_ac ON tlc(action_center_id);

CREATE TABLE tlc_officials (
    id TEXT PRIMARY KEY,
    tlc_id TEXT REFERENCES tlc(id) ON DELETE CASCADE,
    person_id TEXT REFERENCES person(id),
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tlc_officials ON tlc_officials(tlc_id, person_id);

-- =========================================
-- Operational units
-- =========================================

CREATE TABLE operational_unit_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    description TEXT,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE operational_unit (
    id TEXT PRIMARY KEY,
    operational_unit_type_id INTEGER REFERENCES operational_unit_type(id),
    code TEXT,
    name TEXT,
    mandate TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_operational_unit_type ON operational_unit(operational_unit_type_id);

CREATE TABLE operational_unit_service (
    id TEXT PRIMARY KEY,
    operational_unit_id TEXT REFERENCES operational_unit(id) ON DELETE CASCADE,
    formation_id TEXT REFERENCES formation(id),
    service_type TEXT,
    policy_version TEXT
);
CREATE INDEX idx_operational_service ON operational_unit_service(operational_unit_id, formation_id);

CREATE TABLE operational_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    name TEXT,
    description TEXT
);

CREATE TABLE operational_assignment (
    id TEXT PRIMARY KEY,
    operational_unit_id TEXT REFERENCES operational_unit(id) ON DELETE CASCADE,
    person_id TEXT REFERENCES person(id) ON DELETE CASCADE,
    operational_role_id INTEGER REFERENCES operational_role(id),
    start_date TEXT,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_operational_assignment ON operational_assignment(operational_unit_id, person_id);

-- =========================================
-- Readiness pools
-- =========================================

CREATE TABLE readiness_pool (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_rank_id INTEGER REFERENCES rank(id),
    criteria_summary TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE readiness_pool_assignment (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES person(id) ON DELETE CASCADE,
    readiness_pool_id TEXT REFERENCES readiness_pool(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('PENDING','READY','PROMOTED','WITHDRAWN')),
    start_date TEXT,
    end_date TEXT,
    policy_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_readiness_person ON readiness_pool_assignment(person_id);
CREATE INDEX idx_readiness_pool ON readiness_pool_assignment(readiness_pool_id);

-- Trigger: readiness promotion enforcement
CREATE TRIGGER trg_readiness_promotion_notice
AFTER UPDATE ON readiness_pool_assignment
FOR EACH ROW
WHEN NEW.status = 'PROMOTED'
BEGIN
    SELECT RAISE(ABORT, 'Promotion recorded; ensure rank assignment follows');
END;

-- =========================================
-- Certifications
-- =========================================

CREATE TABLE certification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    immutable INTEGER DEFAULT 1
);

CREATE TABLE person_certification (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES person(id) ON DELETE CASCADE,
    certification_id INTEGER REFERENCES certification(id),
    awarded_date TEXT,
    issuer TEXT,
    reference TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_person_cert ON person_certification(person_id);

-- =========================================
-- Tenure
-- =========================================

CREATE TABLE tenure (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES person(id) ON DELETE CASCADE,
    entity_type TEXT CHECK(entity_type IN ('OFFICE','RANK','BOARD','OPERATIONAL')),
    entity_id TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tenure_person ON tenure(person_id);

-- =========================================
-- Platform
-- =========================================

CREATE TABLE platform (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    purpose TEXT,
    owner_formation_id TEXT REFERENCES formation(id),
    operational_unit_id TEXT REFERENCES operational_unit(id),
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_platform_owner ON platform(owner_formation_id);
CREATE INDEX idx_platform_unit ON platform(operational_unit_id);

-- =========================================
-- Audit log
-- =========================================

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT,
    entity_id TEXT,
    action TEXT,
    performed_by TEXT,
    performed_at TEXT DEFAULT (datetime('now')),
    details TEXT
);

-- Trigger: simple audit logging (person table)
CREATE TRIGGER trg_audit_person
AFTER INSERT ON person
FOR EACH ROW
BEGIN
    INSERT INTO audit_log(entity_type, entity_id, action, performed_by, details)
    VALUES (
        'person',
        NEW.id,
        'INSERT',
        'system',
        json_object(
            'id', NEW.id,
            'official_name', NEW.official_name,
            'user_name', NEW.user_name,
            'country', NEW.country,
            'created_at', NEW.created_at
        )
    );
END;

-- =========================================
-- Default mentorship structures
-- =========================================

INSERT INTO mentorship_structure_type (code,name,description) VALUES
('CIRCLE','Mentee Circle','Basic grouping for new members'),
('FOLD','Mentee Fold','Intermediate functional group'),
('CLUSTER','Mentee Cluster','Advanced collaborative unit'),
('CONCLAVE','Mentee Conclave','Highest mentee functional assembly');

-- =========================================
-- END OF FINAL SQLITE SCHEMA
-- =========================================
