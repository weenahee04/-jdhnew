# 🔧 แก้ไข Anchor Build Warnings

## ⚠️ Warnings ที่พบ

### 1. Version Mismatch
```
WARNING: 'anchor-lang' version (0.30.0) and the current CLI version (0.32.1) don't match.
This can lead to unwanted behavior.
```

### 2. Dependency Conflict
```
WARNING: Adding 'solana-program' as a separate dependency might cause conflicts.
```

---

## ✅ วิธีแก้

### 1. แก้ไข Version Mismatch

**เพิ่ม `[toolchain]` section ใน `Anchor.toml`:**

```toml
[toolchain]
anchor_version = "0.30.0"
```

**หรืออัพเกรด `anchor-lang` เป็น 0.32.1:**
```toml
# ใน programs/jdh-chain/Cargo.toml
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
```

---

### 2. แก้ไข Dependency Conflict

**ลบ `solana-program` จาก `Cargo.toml`:**

**ก่อน:**
```toml
[dependencies]
anchor-lang = "0.30.0"
anchor-spl = "0.30.0"
solana-program = "~1.18.0"  # ลบบรรทัดนี้
```

**หลัง:**
```toml
[dependencies]
anchor-lang = "0.30.0"
anchor-spl = "0.30.0"
```

**แก้ไข import ในโค้ด Rust:**

**ก่อน:**
```rust
use solana_program::...;
```

**หลัง:**
```rust
use anchor_lang::solana_program::...;
```

---

## ✅ ไฟล์ที่แก้ไข

### 1. `Anchor.toml`
- เพิ่ม `[toolchain]` section

### 2. `programs/jdh-chain/Cargo.toml`
- ลบ `solana-program` dependency

### 3. `programs/jdh-chain/src/*.rs` (ถ้ามี)
- เปลี่ยน `use solana_program` เป็น `use anchor_lang::solana_program`

---

## ✅ หลังแก้ไข

### Build อีกครั้ง:

```bash
# ใน WSL terminal
cd /mnt/c/Users/ADMIN/Downloads/jjdh\ a
anchor build
```

**ควร build สำเร็จโดยไม่มี warnings!** ✅

---

## 💡 หมายเหตุ

- **Version mismatch** - Anchor CLI 0.32.1 แต่ใช้ anchor-lang 0.30.0
  - **วิธีที่ 1:** ระบุ `anchor_version = "0.30.0"` ใน Anchor.toml (แนะนำ)
  - **วิธีที่ 2:** อัพเกรด anchor-lang เป็น 0.32.1

- **Dependency conflict** - `solana-program` ถูก export จาก `anchor-lang` แล้ว
  - ไม่ต้องเพิ่มเป็น dependency แยก
  - ใช้ `anchor_lang::solana_program` แทน

---

**แก้ไขเสร็จแล้ว! ลอง build อีกครั้ง** 🚀

