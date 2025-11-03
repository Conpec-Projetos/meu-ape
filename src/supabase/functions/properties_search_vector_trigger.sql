ALTER TABLE public.properties DROP COLUMN IF EXISTS search_vector;
ALTER TABLE public.properties ADD COLUMN search_vector tsvector;

-- Atualiza as linhas que já existem
UPDATE public.properties
SET search_vector = to_tsvector('portuguese',
  coalesce(name,'') || ' ' ||
  coalesce(address,'') || ' ' ||
  coalesce(description,'') || ' ' ||
  coalesce(array_to_string(features, ' '), '')
);

-- Função acionada pelo gatilho
CREATE OR REPLACE FUNCTION public.properties_search_vector_trigger()
RETURNS trigger AS $$
begin
  NEW.search_vector := to_tsvector('portuguese',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(NEW.address,'') || ' ' ||
    coalesce(NEW.description,'') || ' ' ||
    coalesce(array_to_string(NEW.features, ' '),'')
  );
  return NEW;
end
$$ LANGUAGE plpgsql;

-- Gatilho
DROP TRIGGER IF EXISTS properties_search_vector_update ON public.properties;
CREATE TRIGGER properties_search_vector_update
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.properties_search_vector_trigger();