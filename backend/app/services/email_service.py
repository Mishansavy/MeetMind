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


def send_otp_email(to_email: str, otp: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your MeetMind login code"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    html = f"""
    <p>Your one-time login code for MeetMind is:</p>
    <h2 style="letter-spacing:8px;font-size:32px;font-weight:bold;color:#1e293b;">{otp}</h2>
    <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    """
    msg.attach(MIMEText(html, "html"))
    _send(msg)


def send_password_reset_email(to_email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your MeetMind password"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    html = f"""
    <p>Click the link below to reset your MeetMind password:</p>
    <a href="{reset_url}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;">Reset password</a>
    <p style="margin-top:16px;color:#64748b;font-size:13px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
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