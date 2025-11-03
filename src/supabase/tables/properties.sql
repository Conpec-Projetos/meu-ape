-- Habilita a extensão PostGIS para dados geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    address TEXT,
    description TEXT,
    location GEOGRAPHY(Point, 4326), -- Tipo de dado geoespacial para consultas de proximidade
    delivery_date TIMESTAMPTZ,
    launch_date TIMESTAMPTZ,
    features TEXT[], -- Array nativo de strings
    floors INTEGER,
    units_per_floor INTEGER,
    property_images TEXT[],
    areas_images TEXT[],
    matterport_urls TEXT[],
    groups TEXT[],
    search_vector TSVECTOR, -- Coluna otimizada para busca full-text 
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    original_firestore_id TEXT UNIQUE
);

-- Cria um índice GIN para otimizar a busca full-text
CREATE INDEX properties_search_idx ON properties USING GIN(search_vector);

-- Cria um índice GIST para otimizar consultas geoespaciais
CREATE INDEX properties_location_idx ON properties USING GIST(location);