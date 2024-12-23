-- Create userprofiles first
CREATE TABLE IF NOT EXISTS userprofiles (
    id SERIAL PRIMARY KEY,
    phone_no VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password TEXT,
    img_url VARCHAR(255),
    phone_otp VARCHAR(6),
    verify_phone BOOLEAN DEFAULT FALSE,
    email_otp VARCHAR(6),
    verify_email BOOLEAN DEFAULT FALSE,
    kycStatus VARCHAR(20) DEFAULT 'Pending',
    referralno VARCHAR(30),
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- Create BankDetails after userprofiles
CREATE TABLE IF NOT EXISTS BankDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    account_no VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- Account Type (e.g., Savings, Current)
    account_holder_name VARCHAR(100),
    bank_name VARCHAR(100),
    micr_no VARCHAR(20),
    ifsc_code VARCHAR(11) NOT NULL,
    default_bank BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES userprofiles(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS BankDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    account_no VARCHAR(20) NOT NULL, -- Account number
    account_type VARCHAR(20) NOT NULL, -- Account Type (e.g., Savings, Current)
    account_holder_name VARCHAR(100), -- Account holder's name
    bank_name VARCHAR(100), -- Bank name
    bank_address VARCHAR(255), -- Bank address
    account_opening_date DATE, -- Date when the account was opened
    branch_code VARCHAR(50), -- Branch code or ID
    micr_no VARCHAR(20), -- MICR number
    ifsc_code VARCHAR(11) NOT NULL, -- IFSC code
    default_bank BOOLEAN DEFAULT FALSE, -- Default bank for transactions
    account_holder_type VARCHAR(50), -- Type of account holder (e.g., Individual, Joint, Company)
    transaction_mode VARCHAR(20), -- Mode of transaction (e.g., NEFT, RTGS, Cheque)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES userprofiles(id) ON DELETE CASCADE
);


-- Create NomineeDetails after userprofiles
CREATE TABLE IF NOT EXISTS NomineeDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- Reference to the client (foreign key can be added if needed)
    nominee_name VARCHAR(40), -- Nominee 1 Name
    nominee_relationship VARCHAR(40), -- Nominee 1 Relationship
    nominee_applicable_percent NUMERIC(5, 2), -- Nominee 1 Applicable(%)
    minor_flag CHAR(1), -- Nominee 1 Minor Flag ('Y' or 'N')
    nominee_dob DATE, -- Nominee 1 DOB
    nominee_guardian VARCHAR(35), -- Nominee 1 Guardian
    nomine_address VARCHAR(255),
    nominee_kyc_status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES userprofiles(id) ON DELETE CASCADE
);













CREATE TABLE IF NOT EXISTS UserProfiles (
    id SERIAL PRIMARY KEY,
    phone_no VARCHAR(10) UNIQUE NOT NULL,
    phone_otp VARCHAR(6),  -- OTP for phone verification
    verify_phone BOOLEAN DEFAULT FALSE,  -- Phone verification status
    email VARCHAR(50) UNIQUE,
    email_otp VARCHAR(6),  -- OTP for email verification  
    verify_email BOOLEAN DEFAULT FALSE,  -- Email verification status  
    password TEXT,
    img_url VARCHAR(255),  -- Store the image URL
    kycStatus VARCHAR(20) DEFAULT 'Pending',  -- KYC status
    referral_id VARCHAR(50),  -- Sub-broker's referral ID
    user_status VARCHAR(20) DEFAULT 'Active',  -- Track user status
    access_token TEXT,  -- JWT Token
    refresh_token TEXT,  -- Refresh Token
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS uccProfile(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    client_id VARCHAR(10) UNIQUE,--UCC Code
    phone_declaration_flag VARCHAR(2) DEFAULT 'SE',
    email_declaration_flag VARCHAR(2) DEFAULT 'SE',
    primary_holder_first_name VARCHAR(70) NOT NULL,
    primary_holder_middle_name VARCHAR(70),
    primary_holder_last_name VARCHAR(70),
    tax_status VARCHAR(50) NOT NULL, -- Replacing FK to `tax_statuses`
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    primary_holder_dob DATE NOT NULL,
    occupation VARCHAR(50) NOT NULL, -- Replacing FK to `occupations`
    holding_nature VARCHAR(50) CHECK(holding_nature IN ('SI','JO','AS')) NOT NULL, -- Replacing FK to `holding_natures`
    client_type CHAR(1) DEFAULT 'P' CHECK (client_type IN ('P', 'D')),
    marital_status VARCHAR(20),  -- E.g., Married, Single, Divorced
    communication_mode VARCHAR(20) NOT NULL, -- Replacing FK to `communication_modes`
    nomination_opt CHAR(1) CHECK (nomination_opt IN ('Y', 'N'))
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS Addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign Key to UserProfiles
    address_type VARCHAR(20),  -- Permanent, Correspondence, etc.
    address_1 VARCHAR(40),
    address_2 VARCHAR(40),
    address_3 VARCHAR(40),
    city VARCHAR(35),
    state VARCHAR(50), -- Replacing FK to `states`
    pincode CHAR(6),
    country VARCHAR(50), -- Replacing FK to `countries`
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BankDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign Key to UserProfiles
    account_type VARCHAR(2) NOT NULL,  --SB Savings,Cb Current,NO, NE etc.
    account_no VARCHAR(40) NOT NULL,
    bank_name VARCHAR(100),
    account_holder_name VARCHAR(100),
    ifsc_code VARCHAR(11) NOT NULL,
    micr_code VARCHAR(9),
    branch_name VARCHAR(100),
    default_bank_flag CHAR(1) NOT NULL CHECK (default_bank_flag IN ('Y', 'N'))
    transaction_mode VARCHAR(20),  -- P (Physical), E (Electronic)
    divind_pay_mode VARCHAR(2) DEFAULT '02', --01 Cheque 02  Direct Credit 03 04 ECS NEFT 05 RTGS
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS NomineeDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign Key to UserProfiles
    nominee_name VARCHAR(40),
    relationship VARCHAR(50), -- Replacing FK to `relationship_codes`
    percentage_applicable NUMERIC(5, 2),
    minor_flag CHAR(1) CHECK (minor_flag IN ('Y', 'N')),
    nominee_dob DATE,
    guardian_name VARCHAR(35),
    guardian_relationship VARCHAR(50) -- Replacing FK to `relationship_codes`
    nominee_kyc_status VARCHAR(20) DEFAULT 'Pending',  -- KYC status
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS KYCDetails (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign Key to UserProfiles
    pan_exempt CHAR(1) DEFAULT 'N' CHECK(pan_exempt IN ('Y', 'N'))
    pan_number CHAR(10) CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    kyc_status VARCHAR(20) DEFAULT 'Pending',
    kyc_type VARCHAR(20),
    aadhaar_updated CHAR(1) DEFAULT 'N' CHECK (aadhaar_updated IN ('Y', 'N')),
    paperless_flag CHAR(1) DEFAULT 'Z' CHECK (paperless_flag IN ('P', 'Z'))
    kyc_verified_at TIMESTAMP,  -- Date when KYC is verified
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TransactionLogs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign Key to UserProfiles
    transaction_type VARCHAR(20),  -- E.g., 'Registration', 'Bank Update', etc.
    transaction_status VARCHAR(20),  -- E.g., 'Success', 'Failed', etc.
    transaction_ref_no VARCHAR(50) UNIQUE
    transaction_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES UserProfiles(id) ON DELETE CASCADE
);
