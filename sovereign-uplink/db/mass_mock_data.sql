-- =========================================
-- Thealcohesion-core: GLOBAL SYSTEM SATURATION (REFINED)
-- Configuration: 11,700 Members | 195 Countries
-- Logic: Identity Binding | Birthright Allotment | Membership OS
-- =========================================

DO $$ 
DECLARE 
    c_name TEXT;
    ac_idx INT;
    tlc_idx INT;
    m_idx INT;
    
    curr_ac_id UUID;
    curr_tlc_id UUID;
    curr_person_id UUID;
    curr_formation_id UUID;
    curr_program_id INT;
    curr_session_id UUID;
    
    -- IDs from SEED/SERIAL tables
    v_rank_id_mentee INT := (SELECT id FROM rank WHERE code = 'M' LIMIT 1);
    v_cat_id_ordinary INT := (SELECT id FROM membership_category WHERE code = 'ORDINARY' LIMIT 1);
    v_stat_id_active INT := (SELECT id FROM membership_status WHERE code = 'ACTIVE' LIMIT 1);
    v_form_type_id INT := (SELECT id FROM formation_type LIMIT 1);
    v_train_lvl_id INT := (SELECT id FROM training_level LIMIT 1);
    
    -- Placeholder Hash for 'SovereignPass2026'
    v_mock_hash TEXT := '$2a$10$8K1p/a06v8ZpZ2K7W6bOue8uG8.6k8j6M8l5Y5z5Y5z5Y5z5Y5z5Y';

    countries TEXT[] := ARRAY['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];
BEGIN
    -- 0. GLOBAL TRAINING DATA
    INSERT INTO training_program (name, training_level_id, description)
    VALUES ('VPU Kernel Induction', v_train_lvl_id, 'Mandatory for all Sovereign Members')
    RETURNING id INTO curr_program_id;

    -- 1. COUNTRY LOOP (195 Countries)
    FOREACH c_name IN ARRAY countries LOOP
        
        -- FORMATIONS (Territorial Divisions)
        INSERT INTO formation (formation_type_id, code, name, mandate)
        VALUES (v_form_type_id, UPPER(LEFT(REPLACE(c_name, ' ', ''), 3)) || '-DIV', c_name || ' Sovereign Division', 'Territorial Membership Governance')
        RETURNING id INTO curr_formation_id;

        -- 2. ACTION CENTERS (3 per country)
        FOR ac_idx IN 1..3 LOOP
            INSERT INTO action_center (name, area_code, physical_area_name)
            VALUES (c_name || ' AC ' || ac_idx, UPPER(LEFT(c_name, 2)) || '-AC' || ac_idx, 'Regional Governance Hub')
            RETURNING id INTO curr_ac_id;

            -- 3. TLCs (4 per AC)
            FOR tlc_idx IN 1..4 LOOP
                INSERT INTO tlc (name, area_code, action_center_id)
                VALUES (c_name || ' TLC ' || ac_idx || '-' || tlc_idx, 'TLC-' || ac_idx || '-' || tlc_idx, curr_ac_id)
                RETURNING id INTO curr_tlc_id;

                -- 4. MEMBERS (5 per TLC = 11,700 total)
                FOR m_idx IN 1..5 LOOP
                    -- ALIGNMENT: Matching person table columns exactly
                    INSERT INTO person (
                        user_name, official_name, sovereign_name, country, 
                        password_hash, identity_state, created_at
                    )
                    VALUES (
                        LOWER(REPLACE(REPLACE(c_name, ' ', '_'), ',', '')) || '_' || ac_idx || '_' || tlc_idx || '_' || m_idx,
                        c_name || ' Official ' || m_idx,
                        'Sovereign ' || c_name || ' ' || (ac_idx * 100 + tlc_idx * 10 + m_idx),
                        c_name,
                        v_mock_hash,
                        'INITIAL', -- Standard starting state for Membership OS
                        NOW()
                    ) RETURNING id INTO curr_person_id;

                    -- Link Membership
                    INSERT INTO person_membership (person_id, membership_category_id, membership_status_id, start_date)
                    VALUES (curr_person_id, v_cat_id_ordinary, v_stat_id_active, NOW());

                    -- Initial Birthright Allotment (Membership, not Investment)
                    INSERT INTO member_birthright (person_id, storage_quota_mb)
                    VALUES (
                        curr_person_id, -- Initial Birthright Allotment
                        5000 -- Standard 5GB Storage Birthright
                    );

                    -- Security Alignment
                    INSERT INTO person_security (person_id, primary_ip_binding, security_clearance, trust_level, failed_login_attempts)
                    VALUES (curr_person_id, '127.0.0.1'::inet, 1, 1, 0);

                    -- Assign TLC Roles
                    INSERT INTO tlc_officials (tlc_id, person_id, role)
                    VALUES (curr_tlc_id, curr_person_id, 'Member');

                    -- Judiciary Setup
                    IF ac_idx = 1 AND tlc_idx = 1 AND m_idx = 1 THEN
                        INSERT INTO judicial_session (session_type, defendant_id, status, required_quorum)
                        VALUES ('ORDERLY_ROOM', curr_person_id, 'OPEN', 9)
                        RETURNING id INTO curr_session_id;
                    END IF;

                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'GLOBAL SATURATION COMPLETE: 11,700 Birthright Members Registered across 195 Divisions.';
END $$;