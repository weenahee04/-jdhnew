# E2E Tests - Authentication & Profile Flow

## 📋 Overview

E2E tests สำหรับตรวจสอบ flow การสมัครสมาชิก, ล็อกอิน, และ profile persistence

## 🚀 Quick Start

### ติดตั้ง Dependencies

```bash
npm install
npx playwright install chromium
```

### รัน Tests

```bash
# รัน tests ทั้งหมด
npm run test:e2e

# รัน tests แบบเห็น browser (headed mode)
npm run test:e2e:headed

# รัน tests แบบ UI mode (interactive)
npm run test:e2e:ui

# รัน tests แบบ debug mode
npm run test:e2e:debug
```

## 📁 Structure

```
tests/
└── e2e/
    ├── auth-profile.spec.ts    # Main test file
    ├── helpers/
    │   └── auth-helpers.ts      # Helper functions
    └── README.md               # This file
```

## ✅ Test Cases

1. **Register success** - ตรวจสอบ redirect และ session
2. **Profile matches registration** - ตรวจสอบข้อมูล profile
3. **Data persists after refresh** - ตรวจสอบ persistence
4. **Duplicate email error** - ตรวจสอบ validation
5. **Login success** - ตรวจสอบ login flow
6. **Login error** - ตรวจสอบ error handling

## 🔧 Configuration

- **Base URL:** http://localhost:3000 (configurable via `BASE_URL` env var)
- **Browser:** Chromium (default)
- **Screenshots:** Captured on failure
- **Videos:** Retained on failure

## 📊 Test Results

Test results จะถูกเก็บไว้ใน:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report

## 🐛 Debugging

### ดู Screenshots

Screenshots จะถูกเก็บไว้ใน `test-results/screenshots/` เมื่อ test fail

### ดู HTML Report

```bash
npx playwright show-report
```

### Debug Mode

```bash
npm run test:e2e:debug
```

จะเปิด Playwright Inspector ที่ช่วย debug step-by-step

## 📝 Notes

- Tests ใช้ unique email สำหรับแต่ละ test run (timestamp-based)
- Tests จะ cleanup test users อัตโนมัติหลัง test เสร็จ
- Tests ตรวจสอบ localStorage และ sessionStorage โดยตรง
- ไม่มี backend API - ทุกอย่างเป็น client-side

## 🔍 Helper Functions

### `generateUniqueEmail()`
สร้าง unique email สำหรับ testing

### `generateUniquePassword()`
สร้าง unique password สำหรับ testing

### `clearStorage(page)`
ล้าง localStorage และ sessionStorage

### `getUserFromStorage(page, email)`
ดึง user data จาก localStorage

### `getCurrentUserFromSession(page)`
ดึง current user จาก sessionStorage

### `cleanupTestUser(page, email)`
ลบ test user จาก localStorage

## ⚠️ Known Limitations

1. **No Display Name Feature**
   - ระบบยังไม่มี displayName field
   - Settings page แสดง hardcoded "User888"
   - Tests ตรวจสอบ data persistence ผ่าน storage

2. **Client-Side Only**
   - ไม่มี backend API
   - ข้อมูลเก็บใน browser storage
   - Tests ตรวจสอบ storage โดยตรง

