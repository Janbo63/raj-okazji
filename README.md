# 🏰 Raj Okazji - Development Control Center

This project is a high-performance, bilingual e-commerce storefront. 

## 🛠 Local Setup (The Sync Bridge)

If you have downloaded these files from AI Studio, follow these steps to get running and sync to GitHub:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   *The site will be available at http://localhost:5173*

3. **Setup Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ZOHO_CLIENT_ID=your_id
   ZOHO_CLIENT_SECRET=your_secret
   ZOHO_REFRESH_TOKEN=your_token
   ```

## ⬆️ Syncing Local to GitHub

1. Create a new **empty** repository on GitHub.
2. Open your terminal in this project folder:
   ```bash
   git init
   git add .
   git commit -m "Sync from AI Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## 🚀 Deployment (Hostinger VPS)

The `.github/workflows/deploy.yml` is already configured. Once you push to GitHub:
1. Go to **Settings > Secrets** in your GitHub Repo.
2. Add `HOSTINGER_IP`, `HOSTINGER_USER`, `SSH_PRIVATE_KEY`, and `GEMINI_API_KEY`.
3. GitHub will automatically build the React app and deploy it to your VPS.

## 📁 Structure
- `/src`: Frontend React + Tailwind (Vite)
- `/backend`: Node.js Express proxy (Handles Zoho OAuth/CORS)
- `/services`: Integration logic for Gemini AI and Zoho Inventory
