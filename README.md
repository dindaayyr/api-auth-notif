# Auth Notification App

Aplikasi autentikasi pengguna, pengelolaan task, dan notifikasi yang terdiri dari backend API dan aplikasi mobile.

## 📌 Deskripsi Project

Project ini terdiri dari backend API dan aplikasi mobile yang digunakan untuk mendukung fitur autentikasi pengguna, pengelolaan task, serta notifikasi pengingat.

## ✨ Fitur

- Registrasi dan login pengguna
- Middleware autentikasi
- Pengelolaan task
- Dukungan notifikasi
- Penjadwalan pengingat task
- Integrasi push notification

## 📂 Struktur Project

```text
api-auth-notif/
├── api-auth-notif/
│   ├── backend/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── notifications.js
│   │   │   └── tasks.js
│   │   ├── scheduler/
│   │   │   └── taskReminder.js
│   │   ├── services/
│   │   │   └── pushService.js
│   │   ├── utils/
│   │   │   └── sendPushNotification.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── schema.sql
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── mobile-auth-notif/
│   ├── assets/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── tasks.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.js
│   │   └── notifications.ts
│   ├── app.json
│   └── package.json
│
└── README.md
```

## 🛠️ Teknologi

**Backend**
- Node.js
- Express.js
- SQL database

**Mobile**
- React Native
- Expo
- JavaScript
- TypeScript

## ⚙️ Menjalankan Backend

1. Masuk ke folder backend project:

   ```bash
   cd api-auth-notif/api-auth-notif
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Salin file `.env.example` menjadi `.env`, lalu isi konfigurasi environment sesuai kebutuhan.

4. Jalankan backend menggunakan script yang tersedia di `package.json`.

## 📱 Menjalankan Mobile

1. Masuk ke folder aplikasi mobile:

   ```bash
   cd mobile-auth-notif
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Sesuaikan URL backend di `src/api.js` dengan alamat server yang digunakan.

4. Jalankan aplikasi:

   ```bash
   npx expo start
   ```

## 🔐 Catatan Keamanan

- Jangan mengunggah file `.env` yang berisi password, API key, atau kredensial rahasia.
- Gunakan `.env.example` sebagai contoh konfigurasi environment.
- Pastikan URL backend sesuai dengan lingkungan pengembangan yang digunakan.

## 🔗 Repository

GitHub: [api-auth-notif](https://github.com/dindaayyr/api-auth-notif)

---

Developed as a mobile application project.
