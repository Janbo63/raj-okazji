# 🏰 Raj Okazji - Online Store

This repository is synced directly from the development environment.

## 🚀 How to Sync
1. Use the **"Save to GitHub"** button in the AI Studio interface.
2. Ensure you have authorized the application to access your GitHub repositories.
3. Select your target repository and branch (`main`).

## 🛠 VPS Deployment
This project is configured for automated deployment to a Hostinger VPS via GitHub Actions.

### Required GitHub Secrets:
- `HOSTINGER_IP`: Your VPS IP.
- `SSH_PRIVATE_KEY`: Your SSH Private Key for VPS access.
- `ZOHO_CLIENT_ID`: From Zoho API Console.
- `ZOHO_CLIENT_SECRET`: From Zoho API Console.
- `GEMINI_API_KEY`: Your Google AI API Key.
- `ZOHO_ORG_ID`: Your Zoho Organization ID.
- `ZOHO_REFRESH_TOKEN`: Your persistent Zoho Refresh Token.

## 🌐 Exposing to the Web (Caddy)
Since you are using Caddy, ensure your Caddyfile points to port 3200:

```caddy
rajokazji.com {
    reverse_proxy localhost:3200
}
```

### 🔑 Zoho Activation:
If you need to generate a new refresh token:
1. Visit `http://YOUR_VPS_IP:3200/api/activate-zoho?code=YOUR_ZOHO_GRANT_CODE`.
2. Copy the returned `refresh_token` and add it to your GitHub Secrets as `ZOHO_REFRESH_TOKEN`.
3. Re-deploy.