import secrets
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import current_app, render_template_string
from app.extensions import db

logger = logging.getLogger(__name__)

VERIFICATION_TEMPLATE = """\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f1f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:60px 20px">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%%">
        <tr><td style="background:#ffffff;border-radius:16px;padding:48px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;letter-spacing:-0.3px">
            Verify your email
          </h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b7280">
            Click the button below to verify your email address and start using Mindly.
          </p>
          <a href="{{ verify_link }}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7C3AED,#A78BFA);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em">
            Verify Email Address
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:24px 0 0">
          <p style="margin:0;font-size:11px;color:#c4b5fd">Mindly — Clear Mind, Better Grind</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def generate_verification_token():
    return secrets.token_urlsafe(48)


def send_verification_email(user):
    from app.models.user import User

    token = generate_verification_token()
    user.verification_token = token
    user.verification_token_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
    verify_link = f"{frontend_url}/verify?token={token}"

    html = VERIFICATION_TEMPLATE.replace("{{ verify_link }}", verify_link)

    smtp_host = current_app.config.get("SMTP_HOST", "")
    smtp_port = current_app.config.get("SMTP_PORT", 587)
    smtp_username = current_app.config.get("SMTP_USERNAME", "")
    smtp_password = current_app.config.get("SMTP_PASSWORD", "")
    smtp_from = current_app.config.get("SMTP_FROM_EMAIL", "noreply@mindly.app")

    if not smtp_host:
        logger.warning("SMTP not configured — verification email not sent to %s", user.email)
        logger.info("Verification link would be: %s", verify_link)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your email — Mindly"
        msg["From"] = smtp_from
        msg["To"] = user.email

        text_part = MIMEText(f"Verify your email: {verify_link}", "plain")
        html_part = MIMEText(html, "html")
        msg.attach(text_part)
        msg.attach(html_part)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        logger.info("Verification email sent to %s", user.email)
        return True
    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", user.email, e)
        return False


def verify_email_token(token):
    from app.models.user import User

    if not token:
        return None

    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return None

    if user.verified_at:
        return user

    if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
        return None

    user.verified_at = datetime.utcnow()
    user.verification_token = None
    user.verification_token_expires_at = None
    db.session.commit()

    return user
