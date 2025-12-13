# Production Checklist

## 🔴 Critical Issues (ต้องแก้ก่อนเปิด Production)

### 1. Security
- [ ] **API Keys Exposure**: GEMINI_API_KEY และ HELIUS_RPC_URL ถูก expose ใน client-side bundle
  - **Solution**: ย้าย API calls ที่ต้องการ secret keys ไป backend API
  - **Current Risk**: API keys สามารถถูกดึงจาก browser DevTools ได้

- [ ] **Private Key Storage**: Private keys เก็บใน memory เท่านั้น (ดีแล้ว) แต่ควรเพิ่ม:
  - Warning message เมื่อ user ปิด browser
  - Session timeout
  - Clear sensitive data เมื่อ unmount

### 2. Tailwind CSS CDN
- [ ] **Current**: ใช้ `cdn.tailwindcss.com` (ไม่เหมาะกับ production)
- [ ] **Solution**: ติดตั้ง Tailwind CSS แบบ PostCSS plugin
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

### 3. Console Logs
- [ ] **Current**: มี console.log/error มากกว่า 3600 instances
- [ ] **Solution**: ลบ console.log ใน production หรือใช้ environment check

### 4. Error Boundaries
- [ ] **Missing**: ไม่มี React Error Boundary
- [ ] **Solution**: เพิ่ม Error Boundary component

### 5. Environment Variables
- [ ] **Missing**: ไม่มี production environment config
- [ ] **Solution**: สร้าง `.env.production` และตรวจสอบว่าไม่มี sensitive data

## ⚠️ Important Issues (ควรแก้)

### 6. Build Optimization
- [ ] Code splitting สำหรับ routes
- [ ] Lazy loading สำหรับ heavy components
- [ ] Tree shaking optimization
- [ ] Bundle size analysis

### 7. Network Error Handling
- [ ] Retry logic สำหรับ API calls
- [ ] Offline detection
- [ ] Network timeout handling
- [ ] User-friendly error messages

### 8. Performance
- [ ] Image optimization
- [ ] Font loading optimization
- [ ] Service Worker สำหรับ caching (optional)

### 9. Analytics & Monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] User analytics (optional)

### 10. Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security audit

## 📝 Nice to Have

### 11. Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### 12. SEO
- [ ] Meta tags
- [ ] Open Graph tags
- [ ] Sitemap

### 13. Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support

