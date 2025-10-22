import { EmailTemplateAgentRequest } from '@/components/features/emails/agent-registration';
import { EmailTemplateVisitRequest } from '@/components/features/emails/visit-request';
import { listAdminEmails } from '@/firebase/users/service';
import { JSX } from 'react';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface agentRequestProp {
    type: "agentRequest",
    agentName: string,
}

interface visitRequestProp {
    type: "visitRequest",
    clientName: string,
    propertyName: string
}


type sendEmailAdminProp = agentRequestProp | visitRequestProp
export async function sendEmailAdmin(data: sendEmailAdminProp) {
    let emailInfo: {subject: string, template: JSX.Element};
    switch(data.type){
        case "agentRequest":
            emailInfo = {
                subject: "Solicitação de cadastro",
                template: EmailTemplateAgentRequest({ fullName: data.agentName }),
            };
            break;

        case "visitRequest":
            emailInfo = {
                subject: "Solicitação de visita",
                template: EmailTemplateVisitRequest({ clientName: data.clientName, propertyName: data.propertyName }),
            };
            break;            
        
        default:
            throw new Error("Undefined email type");
    }

    // TEMP ==============================================================
    const emails = await listAdminEmails(); // 'let' to 'const'
    
    // ===================================================================
    for (let i = 0; i < emails.length; i += 50) {
        const emailBatch = emails.slice(i, i+ 50);
        const { data, error } = await resend.emails.send({
        from: `Meu Apê <${process.env.NEXT_PUBLIC_EMAIL_FROM}>`,
        to: emailBatch,
        subject: emailInfo.subject,
        react: emailInfo.template,
        });

        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            throw new Error("Email send error");
        }        
    }

}

