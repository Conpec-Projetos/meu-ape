import { listAdminEmails } from "@/firebase/users/service";
import { Resend } from "resend";

interface AgentRequestEmailData {
    type: "agentRequest";
    agentName: string;
}
interface VisitRequestEmailData {
    type: "visitRequest";
    clientName: string;
    propertyName: string;
    unitIdentifier?: string;
    unitBlock?: string;
    requestedSlots?: string[];
}
interface ReservationRequestEmailData {
    type: "reservationRequest";
    clientName: string;
    propertyName: string;
    unitIdentifier: string;
    unitBlock?: string;
}

export type SendEmailAdminData = AgentRequestEmailData | VisitRequestEmailData | ReservationRequestEmailData;

const resend = new Resend(process.env.RESEND_API_KEY);

// Monochromatic palette aligned with global design tokens (approximation of oklch vars to hex)
// Light theme tokens (fallbacks) extracted from globals.css (all chroma 0 => neutral grays)
const BRAND_BG = "#0F0F0F"; // header / strong primary surface (derived from --primary / --foreground)
const BRAND_PRIMARY = "#0F0F0F"; // button background (kept identical for a strict mono scheme)
const BRAND_TEXT = "#222222"; // body text (close to --foreground ~ oklch 0.145 0 0)
const BRAND_MUTED = "#555555"; // secondary text
const BRAND_BORDER = "#E5E5E5"; // border (approx from --border oklch 0.922 0 0)
const BRAND_SURFACE = "#FFFFFF"; // card/body surface
const BRAND_BODY_BG = "#F8F9FA"; // outer background (slight gray)

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildSubject(data: SendEmailAdminData): string {
    switch (data.type) {
        case "agentRequest":
            return "Nova solicitação de cadastro de corretor";
        case "visitRequest":
            return "Nova solicitação de visita";
        case "reservationRequest":
            return "Nova solicitação de reserva";
        default:
            return "Nova solicitação";
    }
}

function buildPlainText(data: SendEmailAdminData): string {
    const basePanelUrl = process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "https://meu-ape-conpec.vercel/admin/dashboard";
    switch (data.type) {
        case "agentRequest":
            return `Corretor: ${data.agentName}\nAcesse: ${basePanelUrl}`;
        case "visitRequest": {
            const slots = data.requestedSlots?.length
                ? `\nHorários solicitados:\n- ${data.requestedSlots.join("\n- ")}`
                : "";
            const unitInfo = data.unitIdentifier
                ? `\nUnidade: ${data.unitIdentifier}${data.unitBlock ? ` (Bloco ${data.unitBlock})` : ""}`
                : "";
            return `Cliente: ${data.clientName}\nImóvel: ${data.propertyName}${unitInfo}${slots}\nAcesse: ${basePanelUrl}`;
        }
        case "reservationRequest": {
            const unitInfo = `Unidade: ${data.unitIdentifier}${data.unitBlock ? ` (Bloco ${data.unitBlock})` : ""}`;
            return `Cliente: ${data.clientName}\nImóvel: ${data.propertyName}\n${unitInfo}\nAcesse: ${basePanelUrl}`;
        }
    }
}

export function buildEmailLayout(title: string, innerHtml: string, cta?: { url: string; label: string }) {
    const safeTitle = escapeHtml(title);
    const button = cta
        ? `<a href="${escapeHtml(cta.url)}" style="display:inline-block;margin:4px 0 24px;padding:12px 20px;background:${BRAND_PRIMARY};color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(cta.label)}</a>`
        : "";
    return `<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charSet=\"UTF-8\" /><title>${safeTitle}</title></head>
    <body style="margin:0;padding:32px;background:${BRAND_BODY_BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;color:${BRAND_TEXT};">
      <div style="max-width:640px;margin:0 auto;background:${BRAND_SURFACE};border:1px solid ${BRAND_BORDER};border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
        <div style="background:${BRAND_BG};padding:20px 28px">
          <h1 style="margin:0;font-size:20px;line-height:1.4;color:#FFFFFF;font-weight:600">${safeTitle}</h1>
        </div>
        <div style="padding:28px">
          ${innerHtml}
          ${button}
          <hr style="border:none;border-top:1px solid ${BRAND_BORDER};margin:24px 0" />
          <p style="margin:0;font-size:12px;color:${BRAND_MUTED}">Este e-mail foi gerado automaticamente pelo sistema Meu Apê. Não responda a esta mensagem.</p>
        </div>
      </div>
    </body></html>`;
}

function buildHtml(data: SendEmailAdminData): string {
    const subject = buildSubject(data);
    const basePanelUrl = process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "https://meu-ape-conpec.vercel/admin/dashboard";

    let bodyContent: string;
    switch (data.type) {
        case "agentRequest":
            bodyContent = `<p style=\"margin:0 0 16px\">O corretor <strong>${escapeHtml(
                data.agentName
            )}</strong> solicitou um novo cadastro na plataforma.</p>`;
            break;
        case "visitRequest": {
            const unitInfo = data.unitIdentifier
                ? `<p style=\"margin:0 0 12px\">Unidade: <strong>${escapeHtml(data.unitIdentifier)}${
                      data.unitBlock ? `, Bloco ${escapeHtml(data.unitBlock)}` : ""
                  }</strong></p>`
                : "";
            const slotsMarkup = data.requestedSlots?.length
                ? `<div style=\"margin:0 0 16px\"><p style=\"margin:0 0 8px\">Horários solicitados:</p><ul style=\"padding-left:20px;margin:0\">${data.requestedSlots
                      .map(s => `<li style=\"margin:4px 0\">${escapeHtml(s)}</li>`)
                      .join("")}</ul></div>`
                : "";
            bodyContent = `<p style=\"margin:0 0 16px\">O cliente <strong>${escapeHtml(
                data.clientName
            )}</strong> solicitou uma visita para o imóvel <strong>${escapeHtml(data.propertyName)}</strong>.</p>${unitInfo}${slotsMarkup}`;
            break;
        }
        case "reservationRequest": {
            bodyContent = `<p style=\"margin:0 0 16px\">O cliente <strong>${escapeHtml(
                data.clientName
            )}</strong> solicitou uma reserva para o imóvel <strong>${escapeHtml(
                data.propertyName
            )}</strong>.</p><p style=\"margin:0 0 12px\">Unidade: <strong>${escapeHtml(data.unitIdentifier)}${
                data.unitBlock ? `, Bloco ${escapeHtml(data.unitBlock)}` : ""
            }</strong></p>`;
            break;
        }
        default:
            bodyContent = `<p style=\"margin:0 0 16px\">Nova solicitação recebida.</p>`;
    }
    return buildEmailLayout(subject, bodyContent, { url: basePanelUrl, label: "Ir para o painel" });
}

export async function sendEmailAdmin(data: SendEmailAdminData) {
    const subject = buildSubject(data);
    const html = buildHtml(data);
    const text = buildPlainText(data);

    const emails = await listAdminEmails();
    if (!emails.length) {
        console.warn("Nenhum e-mail de administrador cadastrado. Abortando envio.");
        return;
    }

    for (let i = 0; i < emails.length; i += 50) {
        const batch = emails.slice(i, i + 50);
        const { error } = await resend.emails.send({
            from: `Meu Apê <${process.env.NEXT_PUBLIC_EMAIL_FROM}>`,
            to: batch,
            subject,
            html,
            text,
        });
        if (error) {
            console.error("Erro ao enviar e-mail:", error);
            throw new Error("Email send error");
        }
    }
}
