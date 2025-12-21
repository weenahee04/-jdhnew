# Quick Fix for Browser Crash

## ปัญหา
Browser crash เนื่องจาก **permissions issue** กับ Chrome Crashpad directory

## วิธีแก้ไข (รันคำสั่งนี้):

```bash
# รัน script เพื่อลบ Crashpad directories
./fix-crashpad-permissions.sh
```

หรือรันด้วยมือ:

```bash
# ปิด Chrome ทั้งหมด
killall "Google Chrome" 2>/dev/null || true
killall "Google Chrome for Testing" 2>/dev/null || true

# ลบ Crashpad directories
rm -rf ~/Library/Application\ Support/Google/Chrome/Crashpad
rm -rf ~/Library/Application\ Support/Google/Chrome\ for\ Testing/Crashpad

# รัน tests อีกครั้ง
npm run test:e2e
```

## ถ้ายัง crash อยู่:

### วิธีที่ 1: Grant Full Disk Access
1. เปิด **System Settings** > **Privacy & Security** > **Full Disk Access**
2. เพิ่ม **Terminal** (หรือ IDE ที่ใช้) เข้าไป
3. Restart Terminal/IDE

### วิธีที่ 2: ใช้ Browser อื่น
แก้ไข `playwright.config.ts`:
```typescript
projects: [
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
],
```

### วิธีที่ 3: รันใน Headed Mode
```bash
npx playwright test --headed
```

