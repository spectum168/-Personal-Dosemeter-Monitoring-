# 🏥 ระบบติดตามปริมาณรังสีสะสมบุคลากรทางการแพทย์ (Radiology Radiation Dose Tracker)

ระบบเว็บแอปพลิเคชันจัดการและวิเคราะห์ปริมาณรังสีสะสมรายบุคคลสําหรับแผนกรังสีเทคนิคและฝ่ายรังสีวิทยา สนับสนุนการนำเข้าไฟล์รายงานผลรังสีอัตโนมัติด้วยระบบ **Gemini AI (AI-Powered PDF Parser)** ช่วยเพิ่มความสะดวกรวดเร็ว แม่นยำ และช่วยคำนวณสถิติพร้อมออกรายงานประเมินความปลอดภัยที่สอดคล้องกับมาตรฐานความปลอดภัยทางรังสี

---

## ✨ คุณสมบัติเด่นของแอปพลิเคชัน (Key Features)

- **AI-Powered PDF Parser**: นำเข้าไฟล์รายงานผลการวัดปริมาณรังสีบุคคล (PDF) จากหน่วยงานภายนอก ระบบ AI จะดึงรายชื่อและค่ารังสี Hp(10) Deep และ Hp(0.07) Shallow ให้อัตโนมัติอย่างแม่นยำ
- **Unique Name Merging & De-duplication**: ยุบรวมข้อมูลชื่อคนเดียวกันที่มีรหัส Badge ID ต่างกัน (เช่น เปลี่ยนรอบการสวมใส่เครื่องวัดรังสี) เพื่อประเมินค่ารังสีรวมและค่าเฉลี่ยต่อรอบได้อย่างถูกต้องตามบุคคลจริง
- **Interactive Analytics Dashboard**: แดชบอร์ดสรุปภาพรวมความเสี่ยงของแผนก, จำนวนผู้รับรังสีเกินเกณฑ์, และกราฟวิเคราะห์แนวโน้มรังสีสะสมรายไตรมาส/รายเดือน
- **Professional Report Generation**: ออกรายงานสรุปตามเกณฑ์มาตรฐานความปลอดภัยทางรังสี และรองรับการบันทึกรายงานเป็นไฟล์ PDF หรือส่งออกเป็นรูปแบบพิมพ์อย่างสมบูรณ์แบบ
- **Full Offline-First / Client Persistence**: ทำงานบนเบราว์เซอร์ได้อย่างรวดเร็ว รองรับการนำเข้า/ส่งออกฐานข้อมูลทั้งหมดในรูปแบบไฟล์ JSON สำรองข้อมูลได้ง่ายและปลอดภัย 100%

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

- **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS 4, Lucide Icons, Recharts, Motion (Animate)
- **Backend (API Proxy)**: Express.js (Node.js) ทำหน้าที่เป็น Gateway ที่ปลอดภัยในการสื่อสารกับ Gemini API โดยไม่เปิดเผย API Key แก่เบราว์เซอร์
- **AI Engine**: `@google/genai` (Gemini 3.5 Flash Model)

---

## 🚀 วิธีการติดตั้งและรันแอปพลิเคชันในเครื่องคอมพิวเตอร์ของคุณ (Local Development)

### 1. โคลนคลังข้อมูลและเตรียมความพร้อม (Clone & Setup)
```bash
# 1. โคลนคลังข้อมูลจาก GitHub ของท่าน
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <REPOSITORY_NAME>

# 2. ติดตั้ง Dependencies ทั้งหมด
npm install
```

### 2. กำหนดค่าคีย์ความลับ (.env Configuration)
คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกคีย์ของท่าน:
```bash
cp .env.example .env
```
เปิดไฟล์ `.env` แล้วใส่คีย์ **Gemini API Key** ที่ท่านได้รับจาก [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY="AIzaSy..."
```

### 3. เริ่มต้นรันแอปพลิเคชันในโหมดพัฒนา (Start Dev Server)
```bash
npm run dev
```
แอปพลิเคชันจะรันขึ้นที่ `http://localhost:3000`

### 4. การคอมไพล์สำหรับเวอร์ชันใช้งานจริง (Production Build)
```bash
# สร้างไฟล์ Static Assets และ Compile ไฟล์ server.ts เป็น CommonJS
npm run build

# สั่งให้เซิร์ฟเวอร์เริ่มทำงานในโหมด Production
npm run start
```

---

## 🌐 คำแนะนำในการ Deploy ไปยังระบบคลาวด์ภายนอก (Deployment Guide)

เนื่องจากโปรเจกต์นี้ทำงานในลักษณะ **Full-Stack (Vite + Express)** วิธีการโฮสต์บนแพลตฟอร์มต่าง ๆ จะง่ายขึ้นมากผ่านการรันโค้ดชุดเดียวกัน:

### Option A: Deploy บน Render.com (ฟรีและสะดวกมาก ✨)
1. สมัครใช้งานและเชื่อมบัญชีกับ GitHub ใน [Render.com](https://render.com/)
2. กด **New** -> **Web Service**
3. เลือกคลังเก็บข้อมูลโปรเจกต์นี้จาก GitHub
4. ตั้งค่า Build & Start Command ดังนี้:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. ไปที่แท็บ **Environment Variables** แล้วเพิ่มคีย์ความลับ:
   - `GEMINI_API_KEY`: คีย์ Gemini API ของคุณ (จาก Google AI Studio)
   - `NODE_ENV`: `production`

### Option B: Deploy บน Railway.app
1. สมัครใช้งานและเชื่อม GitHub ใน [Railway.app](https://railway.app/)
2. กด **New Project** -> **Deploy from GitHub repo**
3. ระบบจะสแกนและตั้งค่าโดยอิงจาก `package.json` ให้อัตโนมัติทันที
4. เพิ่มค่าคีย์ในส่วน **Variables**:
   - `GEMINI_API_KEY`: คีย์ Gemini API ของคุณ
   - `PORT`: `3000` (ตัวแอปจะตรวจพบและเปิดใช้งานพอร์ตนี้เพื่อทำ Route Ingress)

### Option C: Deploy บน Google Cloud Run (โฮสต์คลาวด์มาตรฐานเดียวกับระบบพรีวิว)
คุณสามารถนำ Dockerfile นี้ไปคอมไพล์และพุชขึ้น Google Artifact Registry เพื่อ Deploy บน Cloud Run ได้ทันที โดยตั้งค่าพอร์ตพรีวิวเข้าที่ `3000` และกำหนด Environment Variable เป็นคีย์ Gemini API ของคุณ

---

## 📝 วิธีส่งโค้ดนี้ขึ้น GitHub ด้วยตัวคุณเอง (Commit & Push Guide)

เปิด Terminal ในโฟลเดอร์โครงการนี้ แล้วรันคำสั่งดังต่อไปนี้เพื่อสร้าง Git Repository และส่งขึ้นคลังข้อมูลของคุณ:

```bash
# 1. สร้าง Git repository ในเครื่องคอมพิวเตอร์ของคุณ
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้าระบบประวัติ (รวมทั้งไฟล์ .gitignore เพื่อบล็อก node_modules และความลับต่าง ๆ)
git add .

# 3. สร้าง commit บันทึกเวอร์ชันแรก
git commit -m "feat: init medical radiation dose tracker app"

# 4. ตั้งค่าชื่อสาขาหลักเป็น main
git branch -M main

# 5. เชื่อมต่อเข้ากับ GitHub Repository ของคุณ (เปลี่ยน URL ให้ตรงกับบัญชีคุณ)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 6. พุชโค้ดทั้งหมดขึ้น GitHub
git push -u origin main
```

---
*จัดทำขึ้นเพื่อให้ระบบวิเคราะห์ความปลอดภัยทางรังสีของคุณดำเนินไปอย่างมีประสิทธิภาพและถูกต้องตามหลักวิชาชีพสูงสุด* 🏥🛡️
