# Catat Uang - Cloudflare Workers Backend

Backend API untuk Catat Uang menggunakan Cloudflare Workers + D1 Database.

## Prerequisites

1. Akun Cloudflare (gratis)
2. Wrangler CLI

## Setup

### 1. Install Dependencies

```bash
cd backend-workers
npm install
```

### 2. Login ke Cloudflare

```bash
npx wrangler login
```

### 3. Buat D1 Database

```bash
npx wrangler d1 create catat-uang-db
```

Copy `database_id` yang muncul ke `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "catat-uang-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Ganti ini
```

### 4. Jalankan Migration

```bash
npx wrangler d1 execute catat-uang-db --file=./schema.sql
```

### 5. Set Environment Variables (Secrets)

```bash
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_APP_SECRET
```

### 6. Deploy

```bash
npm run deploy
```

Worker akan di-deploy ke: `https://catat-uang-api.<your-subdomain>.workers.dev`

## Development Lokal

```bash
npm run dev
```

Server akan berjalan di `http://localhost:8787`

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Ubah password
- `GET /api/transactions?userId=xxx` - Get transactions
- `GET /api/transactions/stats?userId=xxx` - Get stats
- `POST /api/transactions` - Create transaction
- `GET /api/users/:userId` - Get user
- `GET /api/users/balance?userId=xxx` - Get balance
- `PUT /api/users/balance` - Update balance
- `GET /webhook` - WhatsApp verification
- `POST /webhook` - Receive WhatsApp messages

## WhatsApp Setup

1. Buat WhatsApp Business App di Meta Developers
2. Set webhook URL: `https://catat-uang-api.<subdomain>.workers.dev/webhook`
3. Set verify token sama dengan `WHATSAPP_VERIFY_TOKEN`
4. Subscribe ke field: `messages`

## Biaya

- Cloudflare Workers: 100,000 requests/hari GRATIS
- D1 Database: 5GB storage GRATIS
- WhatsApp API: 1,000 conversations/bulan GRATIS
