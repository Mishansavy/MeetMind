import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

def send_verification_email(to_email: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    msg = MIMEMultipart("alternative")
    msg["subject"] = "Verify your MeetMind account"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    html = f"""
    <h1>Welcome to MeetMind</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="{verify_url}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())