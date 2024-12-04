CREATE TABLE persons (
    username character varying(255),
    userpassword character varying(255),
    accesstoken character varying(255),
    expirationtime BIGINT DEFAULT NULL,
    easy_solve_time INTEGER DEFAULT NULL,
    medium_solve_time INTEGER DEFAULT NULL,
    hard_solve_time INTEGER DEFAULT NULL,
    easy_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[],
    medium_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[],
    hard_solve_partners TEXT[] DEFAULT ARRAY[]::TEXT[]
);