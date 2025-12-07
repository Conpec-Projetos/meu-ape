CREATE OR REPLACE FUNCTION get_favorites_with_data(
    p_user_id TEXT,
    p_limit INT DEFAULT 15,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    description TEXT,
    delivery_date TIMESTAMPTZ,
    launch_date TIMESTAMPTZ,
    features TEXT[],
    property_images TEXT[],
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    min_unit_price NUMERIC,
    max_unit_price NUMERIC,
    min_unit_size NUMERIC,
    max_unit_size NUMERIC,
    available_bedrooms INT[],
    available_bathrooms INT[],
    available_garages INT[],
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH user_favs AS (
        SELECT property_id, created_at 
        FROM user_favorites 
        WHERE user_id = p_user_id
    ),
    total_rows AS (
        SELECT count(*) as cnt FROM user_favs
    )
    SELECT
        p.id,
        p.name,
        p.address,
        p.description,
        p.delivery_date,
        p.launch_date,
        p.features,
        p.property_images,
        -- Extração segura das coordenadas via PostGIS
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng,
        -- Agregação de dados das unidades
        MIN(u.price) as min_unit_price,
        MAX(u.price) as max_unit_price,
        MIN(u.size_sqm) as min_unit_size,
        MAX(u.size_sqm) as max_unit_size,
        array_agg(DISTINCT u.bedrooms) FILTER (WHERE u.bedrooms IS NOT NULL) as available_bedrooms,
        array_agg(DISTINCT u.baths) FILTER (WHERE u.baths IS NOT NULL) as available_bathrooms,
        array_agg(DISTINCT u.garages) FILTER (WHERE u.garages IS NOT NULL) as available_garages,
        (SELECT cnt FROM total_rows) as total_count
    FROM
        properties p
    JOIN
        user_favs f ON p.id = f.property_id
    LEFT JOIN
        units u ON p.id = u.property_id AND u.is_available = true
    GROUP BY
        p.id, p.location, f.created_at
    ORDER BY
        f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;