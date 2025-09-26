

interface EmailTemplateProps {
  fullName: string;
}

export function EmailTemplateAgentRequest({ fullName }: EmailTemplateProps) {
  return (
    <div>
      <h1>Solicitação de Cadastro</h1>
      <p>O corretor <strong>{fullName}</strong> solicitou um novo cadastro na plataforma.</p>
    </div>
  );
}