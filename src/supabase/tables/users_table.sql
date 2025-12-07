-- Tabela Base (Dados comuns a todos: Clientes, Corretores, Admins)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'agent', 'admin')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'denied')),
    cpf TEXT,
    rg TEXT,
    phone TEXT,
    address TEXT,
    photo_url TEXT,
    documents JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Extensão para Corretores
CREATE TABLE public.agents (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    creci TEXT NOT NULL,
    city TEXT NOT NULL,
    agent_documents JSONB DEFAULT '{}'::jsonb,
    groups TEXT[] DEFAULT '{}'
);

-- Tabela de Favoritos (Substitui o array de referências do Firestore)
CREATE TABLE public.user_favorites (
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE, -- Imóveis continuam sendo UUID (gerados pelo Supabase)
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, property_id)
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_agents_creci ON public.agents(creci);