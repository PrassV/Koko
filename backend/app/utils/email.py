import os
import resend
from app.config import settings

# Initialize Resend
# If no key is set, it might fail or we should handle it gracefully for dev.
# For now, we assume user sets RESEND_API_KEY in env or we fallback to console print.

resend.api_key = os.getenv("RESEND_API_KEY")

async def send_email(to_email: str, subject: str, html_content: str):
    """
    Sends an email using Resend.
    If RESEND_API_KEY is not set, prints to console.
    """
    if not resend.api_key:
        print("------------- EMAIL SIMULATION -------------")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}")
        print("--------------------------------------------")
        return {"id": "simulated_email_id"}

    try:
        params = {
            "from": "Koko <noreply@resend.dev>", # Use default testing domain or configured one
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Build logic: don't crash app if email fails
        return None

async def send_invite_email(to_email: str, tenant_name: str, property_name: str, unit_number: str):
    link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/register?mode=complete_profile&email={to_email}"
    
    html = f"""
    <h2>Welcome to Koko!</h2>
    <p>Hi {tenant_name},</p>
    <p>You have been added as a tenant for <b>{unit_number} at {property_name}</b>.</p>
    <p>Please click the link below to complete your profile and access your tenant dashboard:</p>
    <p>
        <a href="{link}" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Join Koko
        </a>
    </p>
    <p>Or paste this link: {link}</p>
    """
    return await send_email(to_email, "You're invited to join Koko", html)
