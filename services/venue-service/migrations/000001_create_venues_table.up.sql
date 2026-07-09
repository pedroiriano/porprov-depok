CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    map_route_url TEXT,
    city_guide_ids UUID[], -- Array of City Guide IDs related to this venue
    cabor_ids UUID[], -- Array of Cabor IDs played here
    capacity INTEGER DEFAULT 0,
    facilities TEXT,
    readiness_status VARCHAR(50) DEFAULT 'Persiapan', -- e.g., Persiapan, Siap, Sedang Digunakan
    contact_person VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
