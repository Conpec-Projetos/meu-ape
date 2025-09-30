import { EmailTemplateAgentRequest } from '@/components/emailTemplate/agentRegisterRequest';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export async function POST(req: Request) {
  try {
    const { emailTo, agentName } = await req.json();

    const { data, error } = await resend.emails.send({
      from: `Meu Apê <${process.env.NEXT_PUBLIC_EMAIL_FROM}>`,
      to: emailTo,
      subject: 'Solicitação de cadastro',
      react: EmailTemplateAgentRequest({ fullName: agentName }),
    });

    if (error) {
      console.error('Erro ao enviar e-mail:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message || error }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err: unknown) {
    console.error('Erro inesperado:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500 }
    );
  }
}