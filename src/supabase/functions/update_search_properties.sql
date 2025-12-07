-- Atualizar a função de busca para aceitar filtro de grupos
CREATE OR REPLACE FUNCTION search_properties(
    query_text TEXT DEFAULT NULL,
    min_lat DOUBLE PRECISION DEFAULT NULL,
    min_lng DOUBLE PRECISION DEFAULT NULL,
    max_lat DOUBLE PRECISION DEFAULT NULL,
    max_lng DOUBLE PRECISION DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    bedroom_filter INT[] DEFAULT NULL,
    bathroom_filter INT[] DEFAULT NULL,
    garage_filter INT[] DEFAULT NULL,
    groups_filter TEXT[] DEFAULT NULL,
    page_limit INT DEFAULT 15,
    page_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    description TEXT,
    delivery_date TIMESTAMPTZ,
    launch_date TIMESTAMPTZ,
    features TEXT[],
    floors INTEGER,
    units_per_floor INTEGER,
    property_images TEXT[],
    areas_images TEXT[],
    matterport_urls TEXT[],
    groups TEXT[],
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    min_unit_price NUMERIC,
    max_unit_price NUMERIC,
    available_bedrooms INT[],
    available_bathrooms INT[],
    available_garages INT[],
    min_unit_size NUMERIC,
    max_unit_size NUMERIC,
    total_matching_units BIGINT,
    total_properties BIGINT
)
AS $$
DECLARE
    total_properties_count BIGINT;
BEGIN
    -- Calcula total
    SELECT INTO total_properties_count COUNT(DISTINCT p.id)
    FROM properties p
    JOIN units u ON p.id = u.property_id
    WHERE
        (query_text IS NULL OR p.search_vector @@ to_tsquery('portuguese', query_text))
    AND
        (groups_filter IS NULL OR p.groups && groups_filter) -- Lógica de interseção de arrays
    AND
        (min_lat IS NULL OR ST_Intersects(p.location::geometry, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)))
    AND
        (min_price_filter IS NULL OR u.price >= min_price_filter)
    AND
        (max_price_filter IS NULL OR u.price <= max_price_filter)
    AND
        (bedroom_filter IS NULL OR u.bedrooms = ANY(bedroom_filter))
    AND
        (bathroom_filter IS NULL OR u.baths = ANY(bathroom_filter))
    AND
        (garage_filter IS NULL OR u.garages = ANY(garage_filter))
    AND
        u.is_available = TRUE;

    -- Retorna dados
    RETURN QUERY
    SELECT
        p.id, p.name, p.address, p.description, p.delivery_date, p.launch_date, p.features, p.floors, p.units_per_floor, p.property_images, p.areas_images, p.matterport_urls, p.groups,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng,
        MIN(u.price) as min_unit_price,
        MAX(u.price) as max_unit_price,
        array_agg(DISTINCT u.bedrooms) FILTER (WHERE u.bedrooms IS NOT NULL) as available_bedrooms,
        array_agg(DISTINCT u.baths) FILTER (WHERE u.baths IS NOT NULL) as available_bathrooms,
        array_agg(DISTINCT u.garages) FILTER (WHERE u.garages IS NOT NULL) as available_garages,
        MIN(u.size_sqm) as min_unit_size,
        MAX(u.size_sqm) as max_unit_size,
        COUNT(u.id) as total_matching_units,
        total_properties_count
    FROM
        properties p
    JOIN
        units u ON p.id = u.property_id
    WHERE
        (query_text IS NULL OR p.search_vector @@ to_tsquery('portuguese', query_text))
    AND
        (groups_filter IS NULL OR p.groups && groups_filter) -- O operador && verifica se há sobreposição entre os arrays
    AND
        (min_lat IS NULL OR ST_Intersects(p.location::geometry, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)))
    AND
        (min_price_filter IS NULL OR u.price >= min_price_filter)
    AND
        (max_price_filter IS NULL OR u.price <= max_price_filter)
    AND
        (bedroom_filter IS NULL OR u.bedrooms = ANY(bedroom_filter))
    AND
        (bathroom_filter IS NULL OR u.baths = ANY(bathroom_filter))
    AND
        (garage_filter IS NULL OR u.garages = ANY(garage_filter))
    AND
        u.is_available = TRUE
    GROUP BY
        p.id
    ORDER BY
        p.launch_date DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;