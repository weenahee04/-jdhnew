# Deployment Guide

## Pre-Deployment Checklist

1. ✅ ติดตั้ง Tailwind CSS แบบ PostCSS
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. ✅ สร้าง `.env.production` จาก `.env.production.example`
   - ใส่ Helius RPC URL สำหรับ production
   - ใส่ Gemini API key (ถ้าต้องการ)

3. ✅ Build production
   ```bash
   npm run build:prod
   ```

4. ✅ Test production build locally
   ```bash
   npm run preview
   ```

## Security Warnings

⚠️ **IMPORTANT**: 
- API keys (GEMINI_API_KEY, HELIUS_RPC_URL) ถูก expose ใน client-side bundle
- ใน production ควรย้าย API calls ที่ต้องการ secret keys ไป backend API
- Private keys เก็บใน memory เท่านั้น (ดีแล้ว) แต่ควรเพิ่ม session timeout

## Deployment Options

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Static Hosting
1. Build: `npm run build:prod`
2. Upload `dist/` folder to your hosting provider
3. Configure environment variables in hosting dashboard

## Environment Variables

Set these in your hosting provider's dashboard:
- `HELIUS_RPC_URL` (required)
- `SOLANA_CLUSTER` (default: mainnet-beta)
- `JUPITER_BASE_URL` (default: https://quote-api.jup.ag)
- `GEMINI_API_KEY` (optional)

## Post-Deployment

1. Test all features:
   - Wallet creation
   - Send SOL
   - Receive SOL
   - Swap tokens
   - Transaction history

2. Monitor:
   - Error logs
   - Performance metrics
   - User feedback

