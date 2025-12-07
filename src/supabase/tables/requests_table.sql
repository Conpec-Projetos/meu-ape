-- Enum para status (padroniza os estados)
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied', 'completed', 'canceled');

-- Tabela de Solicitações de Visita
CREATE TABLE public.visit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    
    status request_status DEFAULT 'pending',
    requested_slots TIMESTAMPTZ[] NOT NULL, -- Array nativo de datas
    scheduled_slot TIMESTAMPTZ, -- Data final agendada
    
    client_msg TEXT,
    agent_msg TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Solicitações de Reserva
CREATE TABLE public.reservation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    status request_status DEFAULT 'pending',
    
    client_msg TEXT,
    agent_msg TEXT,
    
    -- Snapshots de documentos específicos desta transação, se necessário
    transaction_docs JSONB DEFAULT '{}'::jsonb, 
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Designação de Corretores (Quem atende qual visita/reserva)
-- Resolve o array 'agents' do Firestore de forma relacional
CREATE TABLE public.request_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Polimorfismo simples: preenche um OU outro
    visit_request_id UUID REFERENCES public.visit_requests(id) ON DELETE CASCADE,
    reservation_request_id UUID REFERENCES public.reservation_requests(id) ON DELETE CASCADE,
    
    assigned_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT one_request_target CHECK (
        (visit_request_id IS NOT NULL AND reservation_request_id IS NULL) OR
        (visit_request_id IS NULL AND reservation_request_id IS NOT NULL)
    )
);

-- Solicitações de Cadastro de Corretor
CREATE TABLE public.agent_registration_requests (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    applicant_data JSONB NOT NULL,
    admin_msg TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_visit_client ON public.visit_requests(client_id);
CREATE INDEX idx_visit_status ON public.visit_requests(status);
CREATE INDEX idx_reservation_client ON public.reservation_requests(client_id);