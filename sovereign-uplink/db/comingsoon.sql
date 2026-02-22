

-- =====================================================
-- MEMBERSHIP & IDENTITY
-- =====================================================

CREATE TABLE membership (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES person(id),
    membership_number VARCHAR(20) UNIQUE NOT NULL,
    membership_state VARCHAR(20) NOT NULL
        CHECK (membership_state IN ('SEED','ACTIVE','SUSPENDED','EXITED')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    suspended_at TIMESTAMP,
    exited_at TIMESTAMP
);

CREATE INDEX idx_membership_person ON membership(person_id);
CREATE INDEX idx_membership_state ON membership(membership_state);


-- =====================================================
--  ACCOUNTS & OWNERSHIP
-- =====================================================

CREATE TABLE account (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL
        CHECK (account_type IN ('HOLDING','INVESTMENT','REVENUE','FUND','SYSTEM')),
    owner_type VARCHAR(20) NOT NULL
        CHECK (owner_type IN ('PERSON','FORMATION','SYSTEM')),
    owner_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_owner ON account(owner_type, owner_id);


-- =====================================================
-- TRANSACTION LEDGER
-- =====================================================

CREATE TABLE transaction_ledger (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID REFERENCES account(account_id),
    to_account_id UUID REFERENCES account(account_id),
    amount NUMERIC(18,8) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'THE',
    transaction_type VARCHAR(30),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('PENDING','APPROVED','POSTED','REJECTED')),
    initiated_by UUID REFERENCES person(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_from ON transaction_ledger(from_account_id);
CREATE INDEX idx_transaction_to ON transaction_ledger(to_account_id);
CREATE INDEX idx_transaction_status ON transaction_ledger(status);


-- =====================================================
-- APPROVAL & GOVERNANCE CONTROL
-- =====================================================

CREATE TABLE approval (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    approval_level INT NOT NULL,
    approved_by UUID REFERENCES person(id),
    decision VARCHAR(20)
        CHECK (decision IN ('APPROVED','REJECTED')),
    remarks TEXT,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_entity ON approval(entity_type, entity_id);
CREATE INDEX idx_approval_decision ON approval(decision);


-- =====================================================
-- INVESTMENT PROJECTS
-- =====================================================

CREATE TABLE investment_project (
    investment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    total_shares INT NOT NULL,
    share_price NUMERIC(18,8) NOT NULL,
    status VARCHAR(20)
        CHECK (status IN ('PENDING','APPROVED','ACTIVE','REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investment_status ON investment_project(status);


CREATE TABLE investment_shareholding (
    shareholding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID REFERENCES investment_project(investment_id),
    person_id UUID REFERENCES person(id),
    shares_owned INT NOT NULL,
    invested_amount NUMERIC(18,8) NOT NULL,
    invested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shareholding_person ON investment_shareholding(person_id);


-- =====================================================
-- LOANS & CREDIT ENFORCEMENT
-- =====================================================

CREATE TABLE loan (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES person(id),
    principal NUMERIC(18,8) NOT NULL,
    interest_rate NUMERIC(5,2),
    status VARCHAR(20)
        CHECK (status IN ('REQUESTED','APPROVED','ACTIVE','CLOSED','DEFAULTED')),
    approved_at TIMESTAMP,
    due_date DATE
);

CREATE INDEX idx_loan_person ON loan(person_id);
CREATE INDEX idx_loan_status ON loan(status);
CREATE INDEX idx_loan_due_date ON loan(due_date);


CREATE TABLE loan_repayment (
    repayment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loan(loan_id),
    amount NUMERIC(18,8) NOT NULL,
    paid_from_account UUID REFERENCES account(account_id),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
--  SYSTEM MODULE REGISTRY
-- =====================================================

CREATE TABLE system_module (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);


-- =====================================================
--  TRANSACTION FINALITY LOGIC
-- =====================================================

CREATE OR REPLACE FUNCTION fn_post_transaction_after_approval()
RETURNS TRIGGER AS $$
DECLARE
    approvals INT;
BEGIN
    SELECT COUNT(*) INTO approvals
    FROM approval
    WHERE entity_type = 'TRANSACTION'
      AND entity_id = NEW.entity_id
      AND decision = 'APPROVED';

    IF approvals >= NEW.approval_level THEN
        UPDATE transaction_ledger
        SET status = 'POSTED'
        WHERE transaction_id = NEW.entity_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_transaction
AFTER INSERT ON approval
FOR EACH ROW
WHEN (NEW.entity_type = 'TRANSACTION')
EXECUTE FUNCTION fn_post_transaction_after_approval();


-- =====================================================
-- AUTO-LOAN DEDUCTION ENGINE
-- =====================================================

CREATE OR REPLACE FUNCTION fn_auto_deduct_loan()
RETURNS VOID AS $$
DECLARE
    l RECORD;
    acc UUID;
BEGIN
    FOR l IN
        SELECT * FROM loan
        WHERE status = 'ACTIVE'
          AND due_date <= CURRENT_DATE
    LOOP
        SELECT account_id INTO acc
        FROM account
        WHERE owner_id = l.person_id
          AND owner_type = 'PERSON'
          AND account_type = 'HOLDING'
          AND status = 'ACTIVE'
        LIMIT 1;

        IF acc IS NOT NULL THEN
            INSERT INTO transaction_ledger (
                from_account_id,
                amount,
                transaction_type,
                status,
                initiated_by
            ) VALUES (
                acc,
                l.principal,
                'LOAN_DEDUCTION',
                'POSTED',
                l.person_id
            );

            UPDATE loan
            SET status = 'CLOSED'
            WHERE loan_id = l.loan_id;
        ELSE
            UPDATE loan
            SET status = 'DEFAULTED'
            WHERE loan_id = l.loan_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT fn_auto_deduct_loan();


-- =====================================================
--  MEMBERSHIP SUSPENSION ON DEFAULT
-- =====================================================

CREATE OR REPLACE FUNCTION fn_suspend_membership_on_default()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE membership
    SET membership_state = 'SUSPENDED',
        suspended_at = CURRENT_TIMESTAMP
    WHERE person_id = NEW.person_id
      AND membership_state = 'ACTIVE';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suspend_on_loan_default
AFTER UPDATE ON loan
FOR EACH ROW
WHEN (NEW.status = 'DEFAULTED')
EXECUTE FUNCTION fn_suspend_membership_on_default();


-- =====================================================
-- GOVERNANCE ROLES & ASSIGNMENTS
-- =====================================================

CREATE TABLE role (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    authority_level INT NOT NULL,
    description TEXT
);

CREATE TABLE person_role (
    person_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES person(id),
    role_id UUID REFERENCES role(role_id),
    formation_id UUID REFERENCES formation(formation_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_person_role_person ON person_role(id);
CREATE INDEX idx_person_role_role ON person_role(role_id);


-- =====================================================
-- CONTRIBUTIONS & SURPLUS
-- =====================================================

CREATE TABLE contribution (
    contribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES person(id),
    formation_id UUID REFERENCES formation(formation_id),
    amount NUMERIC(18,8) NOT NULL CHECK (amount > 0),
    contribution_type VARCHAR(30)
        CHECK (contribution_type IN ('SEED','MONTHLY','SPECIAL','PENALTY')),
    contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contribution_person ON contribution(person_id);
CREATE INDEX idx_contribution_formation ON contribution(formation_id);


CREATE TABLE surplus_pool (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID REFERENCES formation(formation_id),
    total_amount NUMERIC(18,8) DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE surplus_distribution (
    distribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES surplus_pool(pool_id),
    person_id UUID REFERENCES person(id),
    amount NUMERIC(18,8) NOT NULL,
    status VARCHAR(20)
        CHECK (status IN ('PENDING','POSTED','REJECTED')),
    distributed_at TIMESTAMP
);

CREATE INDEX idx_surplus_pool ON surplus_pool(formation_id);
CREATE INDEX idx_surplus_distribution_person ON surplus_distribution(person_id);


-- =====================================================
-- DISCIPLINE, SANCTIONS & AUDIT
-- =====================================================

CREATE TABLE disciplinary_case (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES person(id),
    formation_id UUID REFERENCES formation(formation_id),
    case_type VARCHAR(30)
        CHECK (case_type IN ('MISCONDUCT','FINANCIAL','GOVERNANCE')),
    status VARCHAR(20)
        CHECK (status IN ('OPEN','HEARING','RESOLVED','APPEALED')),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE sanction (
    sanction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES disciplinary_case(case_id),
    sanction_type VARCHAR(30)
        CHECK (sanction_type IN ('WARNING','FINE','SUSPENSION','EXPULSION')),
    amount NUMERIC(18,8),
    imposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disciplinary_person ON disciplinary_case(id);
CREATE INDEX idx_sanction_case ON sanction(case_id);


CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES person(id),
    action TEXT NOT NULL,
    entity_type VARCHAR(30),
    entity_id UUID,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);


-- =====================================================
-- SURPLUS & EXPULSION ENFORCEMENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION fn_post_surplus_distribution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'POSTED' THEN
        INSERT INTO transaction_ledger (
            to_account_id,
            amount,
            transaction_type,
            status,
            initiated_by
        )
        SELECT
            a.account_id,
            NEW.amount,
            'SURPLUS_DISTRIBUTION',
            'POSTED',
            NEW.person_id
        FROM account a
        WHERE a.owner_id = NEW.person_id
          AND a.owner_type = 'PERSON'
          AND a.account_type = 'HOLDING'
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_surplus
AFTER UPDATE ON surplus_distribution
FOR EACH ROW
EXECUTE FUNCTION fn_post_surplus_distribution();


CREATE OR REPLACE FUNCTION fn_freeze_accounts_on_expulsion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sanction_type = 'EXPULSION' THEN
        UPDATE account
        SET status = 'FROZEN'
        WHERE owner_id = (
            SELECT person_id FROM disciplinary_case
            WHERE case_id = NEW.case_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_freeze_on_expulsion
AFTER INSERT ON sanction
FOR EACH ROW
EXECUTE FUNCTION fn_freeze_accounts_on_expulsion();

