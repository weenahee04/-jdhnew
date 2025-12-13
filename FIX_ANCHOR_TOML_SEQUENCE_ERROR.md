# 🔧 แก้ไข Error: invalid type: map, expected a sequence

## ⚠️ ปัญหา

Error: `invalid type: map, expected a sequence` at line 22

**สาเหตุ:** Anchor คาดหวังให้ `test.validator.clone` เป็น **array of tables** (`[[test.validator.clone]]`) ไม่ใช่ single table with array of addresses

---

## ✅ วิธีแก้

### เปลี่ยนจาก:
```toml
[test.validator.clone]
address = [
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
]
```

### เป็น:
```toml
[[test.validator.clone]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"

[[test.validator.clone]]
address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

[[test.validator.clone]]
address = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
```

**สำคัญ:** ใช้ `[[` (double brackets) เพื่อสร้าง array of tables

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

- **`[table]`** = single table (map)
- **`[[table]]`** = array of tables (sequence)
- **Anchor ต้องการ array of tables** สำหรับ `test.validator.clone` เพื่อ clone หลาย programs
- **Addresses เหล่านี้** เป็น program addresses ที่ต้อง clone สำหรับ local testing:
  - `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s` - Metaplex Token Metadata
  - `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` - SPL Token
  - `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` - Associated Token Account

---

## 📚 TOML Syntax Reference

**Single Table:**
```toml
[table]
key = "value"
```

**Array of Tables:**
```toml
[[table]]
key = "value1"

[[table]]
key = "value2"
```

---

**แก้ไขเสร็จแล้ว! ลอง build อีกครั้ง** 🚀

