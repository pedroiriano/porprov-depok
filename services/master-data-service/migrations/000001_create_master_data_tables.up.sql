CREATE TABLE cabors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE nomor_tandings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabor_id UUID NOT NULL REFERENCES cabors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender_category VARCHAR(20) NOT NULL, -- putra, putri, campuran
    match_type VARCHAR(50) NOT NULL,      -- tanding, seni, dll
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kontingens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    region_type VARCHAR(50) NOT NULL,     -- kota, kabupaten
    logo_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nomor_tandings_cabor_id ON nomor_tandings(cabor_id);
