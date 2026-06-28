# Study Tools Hub (star)

เว็บส่วนตัวรวมเครื่องมือการเรียน — สไตล์ iLovePDF: เข้าเว็บ → เลือกเครื่องมือ → ใช้งานได้เลย.

## เครื่องมือ

| Tool | ไฟล์ | ใช้ทำอะไร |
|------|------|-----------|
| ScratchPad | `tools/scratchpad.html` | กระดาษทดชั่วคราว ขีดเขียน ลงสี |
| MindMap | `tools/mindmap.html` | แผนผังความคิด |
| ผังอภิธรรม | `tools/abhidhamma.html` | ลงสีผังอภิธรรม |

## ระบบเก็บข้อมูล

- **อัตโนมัติ:** พิมพ์ปุ๊บเก็บใน `localStorage` ของเครื่องนี้ทันที (แยก key ต่อเครื่องมือ ไม่ปนกัน).
- **พกข้ามเครื่อง:** ใช้ปุ่ม **Save/Export** ในเครื่องมือ → ได้ไฟล์ `.json` เก็บในคอม; เครื่องอื่นกด **Load/Import** เปิดไฟล์นั้น = ได้ข้อมูลกลับ.
- ไม่มี server ไม่มี login — เป็นเว็บ static ล้วน.
- **ธีม Dark/Light** sync ทั้งเว็บผ่าน key `hub_theme`.

## โครงสร้าง

```
index.html          หน้า Hub
tools/              เครื่องมือ (สร้างจาก build-tools.js)
assets/
  hub.css           ธีมหน้า Hub
  shared.js         ปุ่ม "← Hub" + sync ธีม
decoded/            HTML ต้นฉบับ (decode จาก data: URI เดิม) — ใช้ build ใหม่
build-tools.js      สคริปต์ทำความสะอาด tool (strip Firebase ของ AI Studio)
```

## แก้/สร้าง tool ใหม่จากต้นฉบับ

```bash
node build-tools.js
```
จะอ่านจาก `decoded/` → ลบ Firebase ของ AI Studio + ฝัง `shared.js` → เขียนลง `tools/`.

## Deploy ขึ้น GitHub Pages

1. สร้าง repo ชื่อ `star` (public) บน GitHub.
2. push โค้ดทั้งหมดขึ้น repo.
3. Settings → Pages → Source: branch `main`, folder `/ (root)` → Save.
4. รอสักครู่ เว็บจะอยู่ที่ `https://<username>.github.io/star`.

## ที่มา (ของเดิม)

เครื่องมือ 3 ตัวเดิมสร้างใน Google AI Studio เป็น `data:text/html` bookmark
(ไฟล์ `*.txt`). ปัญหาเดิม: code ใหญ่เกินไป sync ข้าม bookmark ไม่ได้.
โปรเจคนี้แปลงเป็นเว็บ static เพื่อแก้ปัญหานั้น.
