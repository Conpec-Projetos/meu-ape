-- Habilita pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices para acelerar pesquisas fuzzy por trigramas
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm ON properties USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING gin (address gin_trgm_ops);

-- Índice para full-text search combinado (se usar tsvector/fts)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(address,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_properties_search_tsv ON properties USING gin(search_tsv);