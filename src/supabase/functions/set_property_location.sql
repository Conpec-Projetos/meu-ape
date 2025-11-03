create or replace function public.set_property_location(
p_property_id uuid,
p_lat double precision,
p_lng double precision
)
returns void
language sql
security definer
set search_path = public
as $$
update public.properties
set location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
where id = p_property_id;
$$;

UPDATE public.properties
SET location = to_tsvector('portuguese',
  coalesce(name,'') || ' ' ||
  coalesce(address,'') || ' ' ||
  coalesce(description,'') || ' ' ||
  coalesce(array_to_string(features, ' '), '')
);