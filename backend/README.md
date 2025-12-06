# Catat Uang Backend

Backend API untuk aplikasi Catat Uang dengan integrasi WhatsApp.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development server
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan username & password
- `POST /api/auth/change-password` - Ubah password

### Transactions
- `GET /api/transactions?userId=xxx` - Get all transactions
- `GET /api/transactions/stats?userId=xxx` - Get summary stats
- `POST /api/transactions` - Create new transaction

### Users
- `GET /api/users/:userId` - Get user info
- `GET /api/users/balance?userId=xxx` - Get initial balance
- `PUT /api/users/balance` - Update initial balance

### WhatsApp Webhook
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive incoming messages

## WhatsApp Setup

1. Buat akun di [Meta for Developers](https://developers.facebook.com/)
2. Buat WhatsApp Business App
3. Setup webhook URL: `https://your-domain.com/webhook`
4. Copy credentials ke `.env`:
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET`

## Message Format

### Income
```
+ 20000 makan siang
+ 1jt gaji
+ 500rb freelance
```

### Expense
```
- 15000 bensin
- 50rb makan
- 2jt bayar kos
```

### Set Initial Balance
```
saldo awal 1000000
saldo awal 500rb
```

### Get Help
```
bantuan
help
```
