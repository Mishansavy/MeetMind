import smtplib
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def _send(msg: MIMEMultipart) -> None:
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, msg["To"], msg.as_string())


def send_verification_email(to_email: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your MeetMind account"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    html = f"""
    <h1>Welcome to MeetMind</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="{verify_url}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    """
    msg.attach(MIMEText(html, "html"))
    _send(msg)


def send_reminder_email(to_email: str, name: str, task_title: str, deadline: date) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Task due tomorrow: {task_title}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    formatted = deadline.strftime("%A, %B %-d")
    html = f"""
    <p>Hi {name},</p>
    <p>Just a heads-up — the following task is due <strong>tomorrow ({formatted})</strong>:</p>
    <blockquote style="border-left:3px solid #3b82f6;padding-left:12px;color:#1e293b;">
        {task_title}
    </blockquote>
    <p>Head over to <a href="{settings.FRONTEND_URL}/dashboard/tasks">MeetMind Tasks</a> to mark it complete or update the deadline.</p>
    """
    msg.attach(MIMEText(html, "html"))
    _send(msg)