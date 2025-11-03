CREATE OR REPLACE FUNCTION public.search_properties_fuzzy_with_total(
  query_text text,
  p_limit int,
  p_offset int
)
RETURNS json AS
$$
  SELECT json_build_object(
    'rows', (SELECT json_agg(r) FROM (
      SELECT p.*
      FROM properties p
      WHERE
        p.name % query_text
        OR p.address % query_text
        OR similarity(p.name, query_text) > 0.10
        OR similarity(p.address, query_text) > 0.10
      ORDER BY greatest(similarity(p.name, query_text), similarity(p.address, query_text)) DESC, p.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) r),
    'total', (SELECT count(*) FROM properties p
              WHERE
                p.name % query_text
                OR p.address % query_text
                OR similarity(p.name, query_text) > 0.10
                OR similarity(p.address, query_text) > 0.10)
  );
$$
LANGUAGE sql STABLE;