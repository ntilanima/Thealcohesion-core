-- =========================================
-- Thealcohesion-core: GLOBAL SYSTEM SATURATION (ALIGNED)
-- Logic: Matches schema.sql (password_hash in person table)
-- =========================================

-- =========================================
-- Thealcohesion-core: GLOBAL SYSTEM SATURATION (FIXED)
-- Logic: Aligned with schema.sql constraints
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
    
    -- Placeholder Hash for 'SovereignPass2026'
    v_mock_hash TEXT := '$2a$10$8K1p/a06v8ZpZ2K7W6bOue8uG8.6k8j6M8l5Y5z5Y5z5Y5z5Y5z5Y';

    countries TEXT[] := ARRAY['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];
BEGIN
    -- 1. COUNTRY LOOP
    FOREACH c_name IN ARRAY countries LOOP
        
        -- 2. ACTION CENTERS
        FOR ac_idx IN 1..3 LOOP
            INSERT INTO action_center (name, area_code, physical_area_name)
            VALUES (c_name || ' AC ' || ac_idx, UPPER(LEFT(REPLACE(c_name, ' ', ''), 2)) || '-AC' || ac_idx, 'Regional Hub')
            RETURNING id INTO curr_ac_id;

            -- 3. TLCs
            FOR tlc_idx IN 1..4 LOOP
                INSERT INTO tlc (name, area_code, action_center_id)
                VALUES (c_name || ' TLC ' || ac_idx || '-' || tlc_idx, 'TLC-' || ac_idx || '-' || tlc_idx, curr_ac_id)
                RETURNING id INTO curr_tlc_id;

                -- 4. MEMBERS
                FOR m_idx IN 1..5 LOOP
                    -- PERSON Table
                    -- REMOVED: provisioning_status (belongs to member_birthright)
                    -- UPDATED: registration_state must be 'INITIAL' (matches schema constraint)
                    INSERT INTO person (
                        official_name, 
                        country, 
                        password_hash,
                        identity_state, 
                        registration_state
                    )
                    VALUES (
                        c_name || ' Native ' || (ac_idx * 100 + tlc_idx * 10 + m_idx),
                        c_name,
                        v_mock_hash,
                        'PROSPECT',
                        'INITIAL'
                    ) RETURNING id INTO curr_person_id;

                    -- BIRTHRIGHT Table
                    INSERT INTO member_birthright (
                        person_id, 
                        storage_quota_mb, 
                        provisioning_status
                    )
                    VALUES (curr_person_id, 5000, 'PENDING');

                    -- SECURITY Table
                    INSERT INTO person_security (
                        person_id, 
                        security_clearance, 
                        trust_level
                    )
                    VALUES (curr_person_id, 1, 1);

                    -- TLC Officials (role must be 'Member' as per your logic)
                    INSERT INTO tlc_officials (tlc_id, person_id, role, start_date)
                    VALUES (curr_tlc_id, curr_person_id, 'Member', CURRENT_DATE);

                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'SUCCESS: Global Saturation Complete (Approx 11,700 Prospects Registered).';
END $$;