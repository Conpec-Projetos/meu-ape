CREATE OR REPLACE VIEW public.all_user_requests AS
SELECT 
    id, 
    'visit' as type, 
    client_id, 
    property_id, 
    status, 
    created_at 
FROM public.visit_requests
UNION ALL
SELECT 
    id, 
    'reservation' as type, 
    client_id, 
    property_id, 
    status, 
    created_at 
FROM public.reservation_requests;