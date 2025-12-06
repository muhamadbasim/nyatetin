# Catat Uang - WhatsApp Bot (Baileys)

Bot WhatsApp untuk mencatat keuangan menggunakan Baileys.

## Setup

### 1. Install Dependencies

```bash
cd backend-baileys
npm install
```

### 2. Buat folder data

```bash
mkdir data
```

### 3. Jalankan Bot

```bash
npm run dev
```

### 4. Scan QR Code

Setelah bot berjalan, QR code akan muncul di terminal. Scan dengan WhatsApp:
1. Buka WhatsApp di HP
2. Klik titik tiga → Linked Devices
3. Klik "Link a Device"
4. Scan QR code di terminal

### 5. Test Bot

Kirim pesan ke nomor WhatsApp yang di-scan:
- `bantuan` - Lihat panduan
- `- 50000 makan siang` - Catat pengeluaran
- `+ 5000000 gaji` - Catat pemasukan
- `saldo` - Cek saldo

## API Endpoints

- `GET /health` - Health check + status WhatsApp
- `GET /qr` - Get QR code (untuk web interface)
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Ubah password
- `GET /api/transactions?userId=xxx` - Get transactions
- `GET /api/transactions/stats?userId=xxx` - Get stats
- `POST /api/transactions` - Create transaction
- `GET /api/users/:userId` - Get user
- `GET /api/users/balance?userId=xxx` - Get balance
- `PUT /api/users/balance` - Update balance

## Deploy ke Railway/Render

1. Push ke GitHub
2. Connect repo ke Railway/Render
3. Set environment variable jika perlu
4. Deploy

Bot akan otomatis reconnect jika session masih valid.

## Catatan

- Session WhatsApp disimpan di folder `auth_info/`
- Database SQLite disimpan di folder `data/`
- Jangan hapus folder `auth_info/` kecuali ingin scan ulang QR
