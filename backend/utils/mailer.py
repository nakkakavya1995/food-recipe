import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)
def send_password_reset_email(to_email, reset_code, user_name="Chef"):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587").strip())
    smtp_user = (
        os.getenv("SMTP_USER")
        or os.getenv("EMAIL_USER")
        or os.getenv("MAIL_USERNAME")
        or ""
    ).strip()
    smtp_pass = (
        os.getenv("SMTP_PASSWORD")
        or os.getenv("EMAIL_PASS")
        or os.getenv("MAIL_PASSWORD")
        or ""
    ).strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "RecipeNest <support@recipenest.com>").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    subject = f"RecipeNest - Password Reset Code: {reset_code}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f2; margin: 0; padding: 20px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #eee; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .header h1 {{ color: #e65100; margin: 0; font-size: 24px; }}
        .code-box {{ background: #fff8e1; border: 2px dashed #ffb300; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }}
        .code {{ font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d84315; }}
        .footer {{ font-size: 12px; color: #888; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🍳 RecipeNest</h1>
          <p style="color: #666; font-size: 14px;">Password Reset Request</p>
        </div>
        <p>Hello <strong>{user_name}</strong>,</p>
        <p>We received a request to reset your RecipeNest account password. Use the verification code below to set a new password:</p>
        <div class="code-box">
          <div class="code">{reset_code}</div>
        </div>
        <p style="font-size: 13px; color: #555;">This code will expire in 15 minutes. If you did not request this password reset, please ignore this email or reach out to support.</p>
        <div class="footer">
          &copy; RecipeNest Culinary App &bull; Cook, Share &amp; Enjoy!
        </div>
      </div>
    </body>
    </html>
    """

    text_content = f"""
Hello {user_name},

Your RecipeNest password reset code is: {reset_code}

This code is valid for 15 minutes. Enter this code on the reset password screen to update your password.

If you did not request this, please ignore this email.

RecipeNest Team
    """
    if not smtp_user or not smtp_pass:
        logger.warning(
            f"[SMTP NOT CONFIGURED] Password reset code for {to_email}: {reset_code}. "
            "To send real emails, set SMTP_USER and SMTP_PASSWORD in backend/.env"
        )
        return {
            "success": False,
            "smtp_configured": False,
            "message": "SMTP credentials not configured in backend/.env. Code logged for testing.",
            "code": reset_code,
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if use_tls:
                server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Password reset email sent successfully to {to_email}")
        return {
            "success": True,
            "smtp_configured": True,
            "message": f"Password reset email dispatched to {to_email}.",
        }
    except Exception as e:
        logger.exception(f"Failed to send email to {to_email}: {e}")
        return {
            "success": False,
            "smtp_configured": True,
            "error": str(e),
            "code": reset_code,
            "message": f"Could not connect to SMTP server: {e}",
        }


def send_recipe_contact_email(to_email, recipient_name, recipe_name, subject, message_text, admin_name="RecipeNest Administrator"):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587").strip())
    smtp_user = (
        os.getenv("SMTP_USER")
        or os.getenv("EMAIL_USER")
        or os.getenv("MAIL_USERNAME")
        or ""
    ).strip()
    smtp_pass = (
        os.getenv("SMTP_PASSWORD")
        or os.getenv("EMAIL_PASS")
        or os.getenv("MAIL_PASSWORD")
        or ""
    ).strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "RecipeNest Support <support@recipenest.com>").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    mail_subject = f"RecipeNest Admin Note: {subject} (Regarding '{recipe_name}')"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f2; margin: 0; padding: 20px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #eee; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .header h1 {{ color: #e11d48; margin: 0; font-size: 22px; }}
        .recipe-badge {{ background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #be123c; font-weight: 600; font-size: 14px; }}
        .message-box {{ background: #f8fafc; border-left: 4px solid #e11d48; border-radius: 4px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }}
        .footer {{ font-size: 12px; color: #888; text-align: center; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🛡️ RecipeNest Administration</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Important communication regarding your recipe</p>
        </div>
        <p>Hello <strong>{recipient_name}</strong>,</p>
        <p>An administrator has reached out regarding your recipe submission:</p>
        <div class="recipe-badge">
          📖 Recipe: <strong>{recipe_name}</strong>
        </div>
        <p style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Subject: {subject}</p>
        <div class="message-box">{message_text}</div>
        <p style="font-size: 13px; color: #64748b;">
          You can log in to your RecipeNest account to view inquiries and update your recipe anytime.
        </p>
        <div class="footer">
          Sent by {admin_name} &bull; RecipeNest Quality &amp; Community Operations
        </div>
      </div>
    </body>
    </html>
    """

    text_content = f"""Hello {recipient_name},

An administrator has reached out regarding your recipe '{recipe_name}'.

Subject: {subject}
Message:
{message_text}

---
Sent by {admin_name}
RecipeNest Team
"""

    if not smtp_user or not smtp_pass:
        logger.warning(
            f"[SMTP NOT CONFIGURED] Recipe contact email to {to_email} for '{recipe_name}': {subject} - {message_text}"
        )
        return {
            "success": False,
            "smtp_configured": False,
            "message": "SMTP credentials not configured in backend/.env. Message recorded in database.",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = mail_subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if use_tls:
                server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Recipe contact email sent to {to_email} for {recipe_name}")
        return {
            "success": True,
            "smtp_configured": True,
            "message": f"Direct email sent to {to_email}.",
        }
    except Exception as e:
        logger.exception(f"Failed to send recipe contact email to {to_email}: {e}")
        return {
            "success": False,
            "smtp_configured": True,
            "error": str(e),
            "message": f"Could not dispatch email: {e}",
        }
