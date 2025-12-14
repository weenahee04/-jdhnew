# 🔧 แก้ไข Error: duplicate key 'address' in Anchor.toml

## ⚠️ ปัญหา

Error: `duplicate key 'address' in table 'test.validator.clone'`

**สาเหตุ:** ในไฟล์ `Anchor.toml` มี key `address` ซ้ำกัน 3 ครั้งใน table `test.validator.clone`

TOML syntax ไม่รองรับ duplicate keys - ต้องใช้ array แทน

---

## ✅ วิธีแก้

### เปลี่ยนจาก:
```toml
[test.validator.clone]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
address = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
```

### เป็น:
```toml
[test.validator.clone]
address = [
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
]
```

---

## ✅ หลังแก้ไข

### Build อีกครั้ง:

```bash
# ใน WSL terminal
cd /mnt/c/Users/ADMIN/Downloads/jjdh\ a
anchor build
```

**ควร build สำเร็จแล้ว!** ✅

---

## 💡 หมายเหตุ

- **TOML ไม่รองรับ duplicate keys** - ต้องใช้ array สำหรับหลายค่า
- **Addresses เหล่านี้** เป็น program addresses ที่ต้อง clone สำหรับ local testing:
  - `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s` - Metaplex Token Metadata
  - `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` - SPL Token
  - `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` - Associated Token Account

---

**แก้ไขเสร็จแล้ว! ลอง build อีกครั้ง** 🚀


