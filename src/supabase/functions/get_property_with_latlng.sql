CREATE OR REPLACE FUNCTION get_property_with_latlng(
    p_id uuid
)
RETURNS TABLE (
    id uuid,
    developer_id uuid,
    name text,
    address text,
    description text,
    delivery_date timestamptz,
    launch_date timestamptz,
    features text[],
    floors integer,
    units_per_floor integer,
    property_images text[],
    areas_images text[],
    matterport_urls text[],
    groups text,
    lat double precision,
    lng double precision
) AS $$
    SELECT
        p.id,
        p.developer_id,
        p.name,
        p.address,
        p.description,
        p.delivery_date,
        p.launch_date,
        p.features,
        p.floors,
        p.units_per_floor,
        p.property_images,
        p.areas_images,
        p.matterport_urls,
        p.groups,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng
    FROM properties p
    WHERE p.id = p_id
    LIMIT 1;
$$ LANGUAGE sql STABLE;
