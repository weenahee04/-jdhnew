# 🔧 Git Setup Guide

## ⚠️ Status

โปรเจคยังไม่ได้ initialize git repository

---

## 🎯 Options

### Option 1: Initialize Git & Connect to Vercel (Recommended)

ถ้าต้องการให้ Vercel deploy อัตโนมัติเมื่อ push:

1. **Initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - JDH Wallet with Backend API"
   ```

2. **Create GitHub Repository:**
   - ไปที่ https://github.com
   - สร้าง repository ใหม่
   - Copy repository URL

3. **Connect to GitHub:**
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

4. **Connect Vercel to GitHub:**
   - ไปที่ Vercel Dashboard
   - Import Project
   - เลือก GitHub repository
   - Vercel จะ deploy อัตโนมัติ

---

### Option 2: Deploy Manual to Vercel

ถ้าไม่ต้องการใช้ Git:

```bash
vercel --prod
```

Vercel จะ deploy จาก local files

---

### Option 3: Initialize Git Only (No Remote)

ถ้าต้องการแค่ track changes:

```bash
git init
git add .
git commit -m "Add backend API with Supabase"
```

---

## 🚀 Quick Start (Recommended)

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Add backend API with Supabase - Production ready"

# Deploy to Vercel (manual)
vercel --prod
```

---

**Status:** ⚠️ **Need to Initialize Git or Deploy Manual**

