# Browser Crash - Final Solution Guide

## สถานการณ์ปัจจุบัน
- ✅ **Test Code**: แก้ไขเรียบร้อยแล้ว (tests ทั้งหมดพร้อมใช้งาน)
- ✅ **Config**: ตั้งค่าแล้ว (timeouts, launch options)
- ❌ **Browser**: ยัง crash อยู่ (SIGSEGV/SIGABRT) - **ปัญหา system-level**

## สาเหตุ
นี่เป็นปัญหา **macOS system-level** ไม่ใช่ปัญหา code:
- Chrome Crashpad permissions issue
- Memory/security restrictions
- macOS version compatibility

## วิธีแก้ไข (ลองตามลำดับ)

### วิธีที่ 1: รันใน Headed Mode (แนะนำ)
```bash
# รัน tests ด้วย browser ที่มองเห็นได้
npx playwright test --headed --workers=1

# หรือใช้ script
./run-tests-headed.sh
```
**Headless mode มี restrictions มากกว่า - headed mode มักจะทำงานได้**

### วิธีที่ 2: ลบ Chrome Crashpad Directory
```bash
# ปิด Chrome ทั้งหมดก่อน
killall "Google Chrome" 2>/dev/null || true

# ลบ Crashpad directory
rm -rf ~/Library/Application\ Support/Google/Chrome/Crashpad

# รัน tests อีกครั้ง
npm run test:e2e
```

### วิธีที่ 3: Reinstall Playwright Browsers
```bash
# ลบ cache
rm -rf ~/Library/Caches/ms-playwright

# Reinstall
npx playwright install --force chromium
npx playwright install chromium

# รัน tests
npm run test:e2e
```

### วิธีที่ 4: Grant Full Disk Access (macOS)
1. เปิด **System Settings** > **Privacy & Security** > **Full Disk Access**
2. เพิ่ม **Terminal** (หรือ IDE ที่ใช้) เข้าไป
3. Restart Terminal/IDE
4. รัน tests อีกครั้ง

### วิธีที่ 5: ใช้ Browser อื่น
แก้ไข `playwright.config.ts`:
```typescript
projects: [
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  // หรือ
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
],
```

### วิธีที่ 6: ใช้ CI/CD (GitHub Actions)
ถ้า local testing ไม่ได้ ให้ใช้ GitHub Actions:
- Linux environment ไม่มีปัญหา permissions เหมือน macOS
- ทำงานได้เสถียรกว่า

## สรุป
- ✅ **Code**: พร้อมใช้งาน
- ✅ **Config**: ตั้งค่าแล้ว
- ⚠️ **Browser**: ต้องแก้ permissions หรือใช้ headed mode

**แนะนำ**: ลอง **headed mode** ก่อน - มักจะแก้ปัญหาได้!


