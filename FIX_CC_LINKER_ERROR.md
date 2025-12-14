# 🔧 แก้ไข Error: linker 'cc' not found

## ⚠️ ปัญหา

Error: `linker 'cc' not found`

**สาเหตุ:** WSL Ubuntu ยังไม่มี C compiler และ build tools ที่จำเป็นสำหรับ compile Rust programs

---

## ✅ วิธีแก้

### ติดตั้ง build-essential (C compiler และ build tools)

```bash
# ใน WSL terminal
sudo apt update
sudo apt install -y build-essential
```

**รอให้ติดตั้งเสร็จ (~2-5 นาที)**

---

## ✅ หลังติดตั้งเสร็จ

### ตรวจสอบ:

```bash
cc --version
gcc --version
```

**ควรเห็น:** version ของ C compiler

---

## ✅ ติดตั้ง Anchor อีกครั้ง

```bash
# ติดตั้ง Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# รอให้ติดตั้งเสร็จ (~5-15 นาที)

# ติดตั้ง Anchor latest
avm install latest
avm use latest

# ตรวจสอบ
anchor --version
```

---

## 📋 สรุปคำสั่ง

```bash
# 1. ติดตั้ง build-essential
sudo apt update
sudo apt install -y build-essential

# 2. ตรวจสอบ
cc --version

# 3. ติดตั้ง Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 4. ตรวจสอบ
anchor --version
```

---

## 💡 หมายเหตุ

- **build-essential** รวมถึง:
  - `gcc` (GNU C Compiler)
  - `g++` (GNU C++ Compiler)
  - `make`
  - และ tools อื่นๆ ที่จำเป็น

- **ต้องใช้ `sudo`** เพราะต้องติดตั้ง system packages

---

**ลองติดตั้ง build-essential ก่อน แล้วติดตั้ง Anchor อีกครั้ง!** 🚀


