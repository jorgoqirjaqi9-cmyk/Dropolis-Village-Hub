import { Resend } from "resend";
import { logger } from "./logger.js";

export async function notifyAdminNewSubmission(submission: {
  id: number;
  senderName: string;
  title: string;
  eventDate: string | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.warn("ADMIN_EMAIL not set — skipping submission notification email");
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set — skipping submission notification email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@dropolis.net";

  const eventDateLine = submission.eventDate
    ? `<p><strong>Ημερομηνία εκδήλωσης:</strong> ${submission.eventDate}</p>`
    : "";

  const adminLink = "https://dropolis.net/admin/news";

  const html = `
    <h2>Νέα υποβολή άρθρου στο Dropolis</h2>
    <p><strong>Αποστολέας:</strong> ${submission.senderName}</p>
    <p><strong>Τίτλος:</strong> ${submission.title}</p>
    ${eventDateLine}
    <p>
      <a href="${adminLink}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;">
        Προβολή στον πίνακα διαχειριστή
      </a>
    </p>
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: adminEmail,
      subject: `[Dropolis] Νέα υποβολή: ${submission.title}`,
      html,
    });

    if (error) {
      logger.error(
        { error, submissionId: submission.id },
        "Resend returned an error for submission notification"
      );
    } else {
      logger.info(
        { submissionId: submission.id, to: adminEmail },
        "Submission notification email sent"
      );
    }
  } catch (err) {
    logger.error(
      { err, submissionId: submission.id },
      "Failed to send submission notification email"
    );
  }
}
