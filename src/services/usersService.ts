import { supabaseAdmin } from "@/supabase/supabase-admin";
import { User } from "@/interfaces/user";

// Utilitário para formatar o retorno (Juntando User + Agent + Favoritos se necessário)
const formatUser = async (user: any) => {
    let agentData = {};
    if (user.role === 'agent') {
        const { data: agent } = await supabaseAdmin
            .from('agents')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (agent) {
            agentData = {
                agentProfile: {
                    creci: agent.creci,
                    city: agent.city,
                    groups: agent.groups,
                    documents: agent.agent_documents
                }
            };
        }
    }
    return { ...user, ...agentData };
};

export const createUser = async (userData: Partial<User>) => {
    // 1. Inserir na tabela base users
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
            id: userData.id, // IMPORTANTE: Usar o UID vindo do Firebase Auth
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
            status: userData.status || 'pending',
            cpf: userData.cpf,
            rg: userData.rg,
            phone: userData.phone,
            address: userData.address,
            documents: userData.documents || {}
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // 2. Se for agente, inserir na tabela agents
    if (userData.role === 'agent' && userData.agentProfile) {
        const { error: agentError } = await supabaseAdmin
            .from('agents')
            .insert({
                user_id: userData.id,
                creci: userData.agentProfile.creci,
                city: userData.agentProfile.city,
                agent_documents: userData.agentProfile.documents || {}
            });
        if (agentError) throw new Error(agentError.message);
    }

    return user;
};

export const getUserProfile = async (userId: string) => {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return await formatUser(user);
};

export const updateUser = async (userId: string, data: Partial<User>) => {
    // Atualiza tabela base
    const { error } = await supabaseAdmin
        .from('users')
        .update({
            full_name: data.fullName,
            phone: data.phone,
            address: data.address,
            cpf: data.cpf,
            // ... mapear outros campos
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;

    // Se tiver dados de agente para atualizar
    if (data.agentProfile) {
         await supabaseAdmin
            .from('agents')
            .update({
                creci: data.agentProfile.creci,
                city: data.agentProfile.city,
                // ...
            })
            .eq('user_id', userId);
    }
};