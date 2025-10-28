CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE, -- Se um imóvel for deletado, suas unidades também são
    identifier TEXT NOT NULL, -- Ex: "Apto 302", "Casa 15"
    block TEXT,
    category TEXT,
    price NUMERIC(12, 2), -- Tipo NUMERIC é preciso para valores monetários
    size_sqm NUMERIC(8, 2), -- Tamanho em m²
    bedrooms INTEGER,
    garages INTEGER,
    baths INTEGER,
    floor INTEGER,
    images TEXT[],
    is_available BOOLEAN DEFAULT TRUE,
    floor_plan_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para otimizar filtros comuns
CREATE INDEX units_property_id_idx ON units(property_id);
CREATE INDEX units_price_idx ON units(price);
CREATE INDEX units_bedrooms_idx ON units(bedrooms);