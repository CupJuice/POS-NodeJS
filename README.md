ระบบ POS 
พัฒนาด้วย Express.js สำหรับ Backend และ EJS สำหรับ Frontend ระบบนี้จัดการการขาย สินค้า สมาชิก พนักงาน และรายงาน โดยใช้การแสดงผลแบบ Server-side Rendering

## ฟีเจอร์หลัก

- ระบบจัดการพนักงาน
- ระบบจัดการสมาชิก
- ระบบจัดการสินค้า
- ระบบขายและชำระเงิน
- ระบบรายงาน

## เทคโนโลยีที่ใช้

- Frontend: EJS, Bootstrap 5, Chart.js
- Backend: Node.js (Express.js), nodemon
- Database: MongoDB,mongoose
- Authentication: Express Session, bcrypt

## การติดตั้ง

ดาวน์โหลดและติดตั้ง MongoDB Community Server จาก [MongoDB](https://www.mongodb.com/try/download/community)

การตั้งค่าฐานข้อมูล:

1. รัน `npm start` เพื่อเริ่มต้นการเชื่อมต่อฐานข้อมูล
2. (ไม่บังคับ) รัน `node seed.js` เพื่อเพิ่มข้อมูลตัวอย่างเข้าสู่ MongoDB

## วิธีการใช้งาน

```bash
# Clone โปรเจกต์
$ git clone https://github.com/CupJuice/POS-NodeJS.git
$ cd POS-NodeJS

# ติดตั้ง Library
$ npm install

# เพิ่มข้อมูลตัวอย่าง (ไม่บังคับ)
$ node seed.js

# รันเซิร์ฟเวอร์
$ npm start
```

เซิฟเวอร์จะรันอยู่ที่ port 8080 สามารถเข้าใช้งานระบบได้ตามลิงค์นี้

http://localhost:8080/

## บัญชีเริ่มต้น (หลัง Seed ข้อมูล)

| ตำแหน่ง | อีเมล | รหัสผ่าน |
|---------|-------|----------|
| ผู้ดูแลระบบ | somchai@pos.com | admin123 |
| ผู้จัดการ | somying@pos.com | manager123 |
| แคชเชียร์ | wichai@pos.com | cashier123 |
| พนักงานขาย | napa@pos.com | staff123 |

นาย ภูบดินทร์ เทพนิมิตร 6714110030 สาขา ITMI
