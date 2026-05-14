/**
 * Posts the generated invoice (base64 PDF) to the n8n webhook, which forwards
 * it as an email attachment. Fire-and-forget — errors are logged but never
 * block the user-facing confirmation flow.
 */

import { env } from './env';
import { invoiceAsBase64, type InvoiceData } from './invoiceGenerator';

export const sendInvoiceEmail = async (data: InvoiceData): Promise<void> => {
  if (!env.n8n.webhookUrl) {
    console.warn('[invoiceEmailSender] VITE_N8N_WEBHOOK_URL not configured — skipping email');
    return;
  }

  const pdfBase64 = invoiceAsBase64(data);
  const payload = {
    recipient: env.n8n.invoiceRecipient,
    customer: data.customer,
    enrollmentId: data.enrollmentId,
    paymentId: data.paymentId,
    program: data.program,
    courseType: data.courseType,
    amount: data.amountInRupees,
    pdfBase64,
  };

  try {
    await fetch(env.n8n.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[invoiceEmailSender] webhook POST failed', err);
  }
};
