interface EmailTemplateProps {
    fullName: string;
}

export function EmailTemplateAgentRequest({ fullName }: EmailTemplateProps) {
    return (
        <div>
            <h1 className="text-xl">Solicitação de Cadastro</h1>
            <p>
                O corretor <strong>{fullName}</strong> solicitou um novo cadastro na plataforma.
            </p>
            <p>
                Veja as informações no <a href="/">Painel de Gerenciamento de Usuários</a>
            </p>
        </div>
    );
}
