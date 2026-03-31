# FinTrack 💰

![FinTrack Banner](https://via.placeholder.com/1200x400?text=FinTrack+Personal+Finance+Intelligence)

**FinTrack** adalah platform pencatatan dan manajemen keuangan pribadi yang dirancang untuk membantu individu memahami, mengontrol, dan mengoptimalkan kondisi finansial mereka. Platform ini menghadirkan fitur lengkap mulai dari pencatatan pengeluaran dan pemasukan, manajemen hutang, tabungan, dana darurat, hingga pencatatan aset dan penyewaan.

Dengan pendekatan data-driven dan AI-assisted insight, FinTrack bertujuan menjadi pusat kendali keuangan pribadi yang mudah digunakan, aman, dan memberikan gambaran menyeluruh terhadap kesehatan finansial pengguna.

> **Status:** 🚧 In Development (Alpha)

## ✨ Fitur Utama

- 📊 **Dashboard Real-time:** Ringkasan kekayaan bersih (Net Worth), arus kas, dan tren pengeluaran.
- 💸 **Pencatatan Cepat:** Input transaksi kurang dari 3 detik.
- 🏠 **Manajemen Aset:** Pelacakan aset tetap, penyusutan nilai, dan properti sewaan.
- 💳 **Hutang & Piutang:** Reminder jatuh tempo dan rekapitulasi hutang.
- 📈 **Laporan Komprehensif:** Ekspor laporan keuangan ke PDF/Excel.
- 🌙 **Dark Mode Support.**

## 🛠 Tech Stack

### Web App (Client)

- **Framework:** [Vuejs](https://vuejs.org/) (TypeScript)
- **Styling:** [Tailwindcss](https://tailwindcss.com/)
- **State Management:** Pinia

### Mobile App (Client)

- **Framework:** [Flutter](https://flutter.dev/) (Dart)
- **State Management:** BLoC / Riverpod
- **Local DB:** SQLite / Drift (Offline-first architecture)
- **Charts:** Fl_chart

### Backend API (Server)

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Runtime:** [Node.js](https://nodejs.org/)
- **Database:** MariaDB LTS
- **ORM:** TypeORM
- **Caching:** Redis
- **Auth:** JWT & Passport

## 🚀 Cara Menjalankan (Getting Started)

### Prasyarat

Pastikan Anda telah menginstal:

- Node.js (v22+)
- Flutter SDK (v3.0+)
- MariaDB LTS
- Docker (Opsional)

### 1. Setup Backend

```bash
# Masuk ke folder backend
cd fintrack-server

# Install dependencies
npm install

# Setup Environment Variable
cp .env.example .env
# (Edit file .env sesuaikan dengan kredensial database Anda)

# Jalankan Database via Docker (Opsional)
docker-compose up -d --build

# Jalankan server (Development)
npm run start:dev
```
