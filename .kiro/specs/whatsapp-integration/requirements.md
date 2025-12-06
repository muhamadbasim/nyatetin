# Requirements Document

## Introduction

Fitur integrasi WhatsApp untuk aplikasi Catat Uang yang memungkinkan pengguna mencatat transaksi keuangan melalui pesan WhatsApp. Sistem akan menerima pesan dari WhatsApp, mem-parsing format transaksi, dan menyinkronkan data secara real-time ke dashboard web. Fitur ini gratis dan tidak memerlukan biaya tambahan dari pengguna.

## Glossary

- **Catat_Uang_System**: Sistem pencatatan keuangan yang terdiri dari backend API, WhatsApp bot, dan dashboard web
- **WhatsApp_Bot**: Komponen yang menerima dan memproses pesan WhatsApp dari pengguna
- **Transaction_Parser**: Modul yang mengubah pesan teks menjadi data transaksi terstruktur
- **Dashboard**: Antarmuka web untuk melihat dan mengelola transaksi keuangan
- **Income_Transaction**: Transaksi pemasukan dengan format `+ [jumlah] [deskripsi]`
- **Expense_Transaction**: Transaksi pengeluaran dengan format `- [jumlah] [deskripsi]`
- **Initial_Balance**: Saldo awal yang diset pengguna dengan format `saldo awal [jumlah]`
- **User_Session**: Sesi pengguna yang diidentifikasi berdasarkan nomor WhatsApp

## Requirements

### Requirement 1: Registrasi dan Autentikasi Pengguna

**User Story:** Sebagai pengguna baru, saya ingin mendaftar melalui WhatsApp, sehingga saya bisa langsung mulai mencatat keuangan tanpa proses registrasi yang rumit.

#### Acceptance Criteria

1. WHEN a user sends their first message to the WhatsApp_Bot THEN the Catat_Uang_System SHALL create a new user account using the phone number as username and generate a random password
2. WHEN a new account is created THEN the WhatsApp_Bot SHALL send a welcome message containing username, password, and dashboard login URL
3. WHEN a user sends a message from a registered phone number THEN the Catat_Uang_System SHALL authenticate the user automatically without requiring additional credentials
4. IF a user sends a message with invalid format THEN the WhatsApp_Bot SHALL respond with a help message explaining valid command formats

### Requirement 2: Pencatatan Transaksi via Teks

**User Story:** Sebagai pengguna, saya ingin mencatat pemasukan dan pengeluaran dengan format teks sederhana, sehingga saya bisa mencatat transaksi dengan cepat.

#### Acceptance Criteria

1. WHEN a user sends a message with format `+ [amount] [description]` THEN the Transaction_Parser SHALL create an Income_Transaction with the specified amount and description
2. WHEN a user sends a message with format `- [amount] [description]` THEN the Transaction_Parser SHALL create an Expense_Transaction with the specified amount and description
3. WHEN the Transaction_Parser receives an amount with shorthand notation (e.g., "20rb", "1jt") THEN the Transaction_Parser SHALL convert the notation to numeric value (20000, 1000000)
4. WHEN a transaction is successfully parsed THEN the WhatsApp_Bot SHALL respond with a confirmation message containing transaction details
5. WHEN the Transaction_Parser receives a message that does not match transaction format THEN the Transaction_Parser SHALL return a parsing error with suggestion for correct format

### Requirement 3: Pengaturan Saldo Awal

**User Story:** Sebagai pengguna, saya ingin mengatur saldo awal, sehingga dashboard menampilkan saldo yang akurat.

#### Acceptance Criteria

1. WHEN a user sends a message with format `saldo awal [amount]` THEN the Catat_Uang_System SHALL update the user's initial balance to the specified amount
2. WHEN the initial balance is updated THEN the WhatsApp_Bot SHALL respond with confirmation showing the new initial balance
3. WHEN a user sends `saldo awal` without amount THEN the WhatsApp_Bot SHALL respond with the current initial balance value

### Requirement 4: Sistem Bantuan

**User Story:** Sebagai pengguna, saya ingin mendapatkan panduan penggunaan, sehingga saya tahu cara menggunakan semua fitur yang tersedia.

#### Acceptance Criteria

1. WHEN a user sends the message `bantuan` or `help` THEN the WhatsApp_Bot SHALL respond with a complete guide of all available commands
2. WHEN the help message is displayed THEN the WhatsApp_Bot SHALL include examples for each command type (income, expense, initial balance)
3. WHEN a user sends an unrecognized command THEN the WhatsApp_Bot SHALL suggest typing `bantuan` for help

### Requirement 5: Sinkronisasi Real-time ke Dashboard

**User Story:** Sebagai pengguna, saya ingin transaksi yang dicatat via WhatsApp langsung muncul di dashboard, sehingga saya bisa melihat data terbaru kapan saja.

#### Acceptance Criteria

1. WHEN a transaction is recorded via WhatsApp_Bot THEN the Catat_Uang_System SHALL persist the transaction to the database within 2 seconds
2. WHEN the Dashboard is opened THEN the Catat_Uang_System SHALL fetch and display all transactions including those recorded via WhatsApp
3. WHEN a new transaction is added while Dashboard is open THEN the Dashboard SHALL update automatically without requiring manual refresh
4. WHEN the user logs into Dashboard THEN the Catat_Uang_System SHALL authenticate using the credentials generated during WhatsApp registration

### Requirement 6: Parsing Foto Struk (OCR)

**User Story:** Sebagai pengguna, saya ingin mengirim foto struk belanja, sehingga sistem bisa otomatis mencatat transaksi dari struk tersebut.

#### Acceptance Criteria

1. WHEN a user sends an image to the WhatsApp_Bot THEN the Catat_Uang_System SHALL process the image using OCR to extract transaction data
2. WHEN OCR successfully extracts transaction data THEN the WhatsApp_Bot SHALL send a confirmation message with parsed amount and description for user verification
3. IF OCR fails to extract valid transaction data THEN the WhatsApp_Bot SHALL respond with an error message asking user to input transaction manually
4. WHEN OCR extracts multiple items from a receipt THEN the Catat_Uang_System SHALL create separate transactions for each item or a single transaction with total amount based on user preference

### Requirement 7: Backend API untuk WhatsApp Webhook

**User Story:** Sebagai developer, saya ingin backend API yang menerima webhook dari WhatsApp, sehingga sistem bisa memproses pesan secara otomatis.

#### Acceptance Criteria

1. WHEN WhatsApp sends a webhook request THEN the Catat_Uang_System SHALL validate the request signature before processing
2. WHEN a valid webhook is received THEN the Catat_Uang_System SHALL parse the message content and route to appropriate handler (text parser or OCR)
3. WHEN the handler completes processing THEN the Catat_Uang_System SHALL send response back to user via WhatsApp API within 5 seconds
4. IF webhook processing fails THEN the Catat_Uang_System SHALL log the error and respond with a generic error message to user

### Requirement 8: Keamanan Data

**User Story:** Sebagai pengguna, saya ingin data keuangan saya aman, sehingga tidak ada orang lain yang bisa mengakses informasi saya.

#### Acceptance Criteria

1. WHEN storing user credentials THEN the Catat_Uang_System SHALL hash passwords using a secure hashing algorithm
2. WHEN transmitting data between components THEN the Catat_Uang_System SHALL use HTTPS encryption
3. WHEN a user accesses the Dashboard THEN the Catat_Uang_System SHALL verify that the user can only view their own transactions
4. WHEN a user requests to change password via Settings THEN the Catat_Uang_System SHALL update the password and confirm via WhatsApp
