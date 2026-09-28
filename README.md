# PromptPay QR Code Generator

เว็บแอปพลิเคชันสำหรับสร้าง QR Code พร้อมเพย์ (PromptPay) เพื่อรับชำระเงิน เพียงแค่กรอกหมายเลขพร้อมเพย์และจำนวนเงิน ระบบจะทำการสร้าง QR Code ให้อัตโนมัติ พร้อมระบบนับเวลาถอยหลังและจัดเก็บข้อมูลอย่างเป็นระบบ

---

## Tech Stack

`Next.js` · `TypeScript` · `Tailwind CSS` · `PostgreSQL` · `QRCode`

---

## Features (คุณสมบัติเด่น)

*   **รองรับหลายรูปแบบ:** รองรับทั้งเบอร์โทรศัพท์มือถือ และ เลขประจำตัวประชาชน 13 หลัก
*   **รองรับจุดทศนิยม:** สามารถระบุจำนวนเงินแบบทศนิยม 2 ตำแหน่งได้
*   **Data Validation:** ตรวจสอบความถูกต้องของข้อมูลแบบ Real-time ก่อนสร้าง QR Code
*   **Auto-Generate:** สร้างและแสดงผล QR Code ทันทีที่กรอกข้อมูลครบถ้วน
*   **Time Limit:** QR Code ที่สร้างขึ้นมาจะแสดงผลบนหน้าเว็บโดยมีอายุการใช้งาน 5 นาที (พร้อมตัวนับเวลาถอยหลัง)
*   **Reset Button:** มีปุ่มกดเพื่อล้างค่าทั้งหมดและเริ่มสร้างรายการใหม่ได้ทันที
*   **Database Integration:** ทำงานร่วมกับ Next.js API และ PostgreSQL อย่างสมบูรณ์

---

## Requirements (สิ่งที่ต้องมี)

*   **Node.js:** Version 20 ขึ้นไป
*   **Database:** PostgreSQL
*   **Package Manager:** npm

---

## Installation & Setup (การติดตั้งและตั้งค่า)

**1. ติดตั้ง Dependencies**
```bash
npm install
```

**2. ตั้งค่า Environment Variables**
สร้างไฟล์ `.env.local` ไว้ที่โฟลเดอร์หลักของโปรเจกต์ และเพิ่ม URL สำหรับเชื่อมต่อ Database:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/promptpay_qr"
```

**3. สร้าง Database**
รันคำสั่ง SQL นี้ใน PostgreSQL ของคุณเพื่อสร้างฐานข้อมูล:
```sql
CREATE DATABASE promptpay_qr;
```

**4. รันเซิร์ฟเวอร์**
```bash
npm run dev
```

**5. เริ่มต้นใช้งาน**
เปิดเบราว์เซอร์แล้วไปที่: [http://localhost:3000](http://localhost:3000)

---

## Usage (วิธีใช้งาน)

1. กรอกหมายเลข PromptPay (เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน)
2. กรอกจำนวนเงินที่ต้องการรับชำระ
3. ระบบจะทำการตรวจสอบและสร้าง QR Code ให้โดยอัตโนมัติ
4. ผู้ใช้สามารถสแกน QR Code เพื่อโอนเงินได้ทันที (ตัว QR Code จะแสดงผลอยู่บนหน้าเว็บ 5 นาที)
5. หากต้องการทำรายการใหม่ สามารถกดปุ่ม **Reset** เพื่อล้างข้อมูลได้ทันที
