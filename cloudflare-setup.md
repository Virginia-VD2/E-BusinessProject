# Cloudflare & Infrastructure Setup Guide

## 1. Domain Configuration
- Purchase domain from **Somopod** (e.g., `velours-patisserie.com`).
- Add the domain to Cloudflare.
- Update Somopod Nameservers to point to Cloudflare's assigned nameservers.
- Add an `A` record pointing `@` to your server's IP address.
- Ensure the **Proxy status** is set to **Proxied** (Orange Cloud).

## 2. SSL/TLS Strict Mode
1. Go to **SSL/TLS -> Overview** in Cloudflare.
2. Set the encryption mode to **Full (Strict)**.
3. Go to **Origin Server** and click **Create Certificate**.
4. Save the `origin.crt` and `origin.key` on your server.
5. Configure your web server (e.g., Nginx) to use these certificates for port 443.

## 3. Web Application Firewall (WAF) Rule for Midtrans
Midtrans webhooks often get blocked by Cloudflare's Bot Fight Mode. You must explicitly allow them.
1. Go to **Security -> WAF -> Custom Rules**.
2. Create a new rule.
3. If `URI Path` equals `/api/webhooks/midtrans`, set action to **Skip**.
4. Select all options under "Skip these features" (WAF, Bot Management, etc.).

## 4. Environment Variables
Copy `.env.example` to `.env` and fill in the production secrets:
```bash
cp .env.example .env
```
Make sure `MIDTRANS_IS_PRODUCTION` is set to `"true"` and use the production server/client keys.
