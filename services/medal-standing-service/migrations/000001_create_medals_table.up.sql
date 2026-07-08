CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kontingen_id UUID NOT NULL,
    gold INT DEFAULT 0,
    silver INT DEFAULT 0,
    bronze INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kontingen_id)
);
