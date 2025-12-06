# Implementation Plan

- [x] 1. Setup Backend Project Structure



  - [x] 1.1 Initialize Node.js project with TypeScript

    - Create `backend/` directory with package.json, tsconfig.json
    - Install dependencies: express, cors, bcrypt, uuid, better-sqlite3
    - Install dev dependencies: typescript, @types/*, ts-node-dev
    - _Requirements: 7.1, 7.2_

  - [x] 1.2 Create project directory structure

    - Create folders: src/routes, src/services, src/models, src/utils, src/types
    - Create entry point src/index.ts with Express server setup
    - _Requirements: 7.1_

  - [ ] 1.3 Setup testing framework
    - Install fast-check, vitest
    - Create vitest.config.ts
    - _Requirements: Testing Strategy_

- [-] 2. Implement Transaction Parser


  - [ ] 2.1 Create type definitions for parser
    - Define ParseResult, ParsedTransaction, CommandType interfaces in src/types/parser.ts
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Implement amount parser with shorthand support


    - Create src/utils/amountParser.ts
    - Support formats: plain number, "rb" (ribu), "jt" (juta), "k"
    - Implement parseAmount() and formatAmount() functions
    - _Requirements: 2.3_
  - [ ]* 2.3 Write property test for amount parser round-trip
    - **Property 2: Amount Shorthand Conversion**
    - **Validates: Requirements 2.3**

  - [x] 2.4 Implement transaction message parser

    - Create src/services/transactionParser.ts
    - Parse income format: `+ [amount] [description]`
    - Parse expense format: `- [amount] [description]`
    - Parse balance commands: `saldo awal [amount]`, `saldo awal`
    - Parse help command: `bantuan`, `help`
    - _Requirements: 2.1, 2.2, 3.1, 3.3, 4.1_
  - [ ]* 2.5 Write property test for transaction parsing round-trip
    - **Property 1: Transaction Parsing Round-Trip**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 2.6 Write property test for invalid message handling
    - **Property 3: Invalid Message Handling**
    - **Validates: Requirements 1.4, 2.5, 4.3**

- [ ] 3. Checkpoint - Ensure parser tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Implement Database Layer


  - [x] 4.1 Create database schema and initialization

    - Create src/database/schema.sql with User and Transaction tables
    - Create src/database/db.ts for SQLite connection
    - Implement initDatabase() function
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Implement User model and repository

    - Create src/models/user.ts with User interface
    - Create src/repositories/userRepository.ts
    - Implement: create, findByPhoneNumber, updatePassword, updateInitialBalance
    - _Requirements: 1.1, 1.3, 3.1, 8.1_
  - [ ]* 4.3 Write property test for user registration idempotence
    - **Property 4: User Registration Idempotence**
    - **Validates: Requirements 1.1, 1.3**

  - [x] 4.4 Implement Transaction model and repository

    - Create src/models/transaction.ts with Transaction interface
    - Create src/repositories/transactionRepository.ts
    - Implement: create, findByUserId, getStatsByUserId
    - _Requirements: 5.1, 5.2_
  - [ ]* 4.5 Write property test for transaction persistence
    - **Property 6: Transaction Persistence**
    - **Validates: Requirements 5.2**
  - [ ]* 4.6 Write property test for user data isolation
    - **Property 7: User Data Isolation**
    - **Validates: Requirements 8.3**

- [ ] 5. Checkpoint - Ensure database tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Implement User Service

  - [x] 6.1 Create authentication utilities


    - Create src/utils/auth.ts
    - Implement: hashPassword, verifyPassword, generateRandomPassword
    - _Requirements: 8.1, 8.4_
  - [ ]* 6.2 Write property test for password security
    - **Property 8: Password Security**
    - **Validates: Requirements 8.1**

  - [x] 6.3 Implement User Service

    - Create src/services/userService.ts
    - Implement: findOrCreate, authenticate, updatePassword, updateInitialBalance, getInitialBalance
    - Auto-generate username from phone number
    - Auto-generate random password for new users
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 8.4_
  - [ ]* 6.4 Write property test for initial balance consistency
    - **Property 5: Initial Balance Update Consistency**
    - **Validates: Requirements 3.1, 3.2**


- [x] 7. Implement Transaction Service


  - [x] 7.1 Create Transaction Service

    - Create src/services/transactionService.ts
    - Implement: createTransaction, getTransactionsByUserId, getStats
    - _Requirements: 2.1, 2.2, 5.1, 5.2_



- [ ] 8. Implement WhatsApp Webhook Handler
  - [ ] 8.1 Create webhook type definitions
    - Create src/types/webhook.ts with WhatsApp webhook payload interfaces

    - _Requirements: 7.1, 7.2_
  - [x] 8.2 Implement webhook signature validation

    - Create src/utils/webhookValidator.ts
    - Implement validateSignature() using HMAC-SHA256
    - _Requirements: 7.1_
  - [ ]* 8.3 Write property test for webhook signature validation
    - **Property 9: Webhook Signature Validation**
    - **Validates: Requirements 7.1**

  - [x] 8.4 Implement message router

    - Create src/services/messageRouter.ts
    - Route text messages to transaction parser
    - Route image messages to OCR handler (placeholder)
    - _Requirements: 7.2_
  - [ ]* 8.5 Write property test for message routing
    - **Property 10: Message Routing Correctness**
    - **Validates: Requirements 7.2**

- [ ] 9. Checkpoint - Ensure webhook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement WhatsApp Response Handler



  - [x] 10.1 Create response message builder

    - Create src/services/responseBuilder.ts
    - Build welcome message with credentials
    - Build transaction confirmation message
    - Build help message with all commands
    - Build error messages in Indonesian
    - _Requirements: 1.2, 2.4, 4.1, 4.2_

  - [x] 10.2 Implement WhatsApp API client

    - Create src/services/whatsappClient.ts
    - Implement sendMessage() using Meta Cloud API
    - Handle API errors gracefully
    - _Requirements: 7.3_


- [-] 11. Create API Routes

  - [x] 11.1 Implement webhook route

    - Create src/routes/webhook.ts
    - GET /webhook for verification
    - POST /webhook for incoming messages
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 11.2 Implement auth routes for dashboard
    - Create src/routes/auth.ts
    - POST /api/auth/login
    - POST /api/auth/change-password
    - _Requirements: 5.4, 8.4_

  - [ ] 11.3 Implement transaction routes for dashboard
    - Create src/routes/transactions.ts
    - GET /api/transactions
    - GET /api/stats
    - POST /api/transactions (for dashboard input)
    - _Requirements: 5.2_

  - [ ] 11.4 Implement user routes
    - Create src/routes/users.ts
    - GET /api/user/balance
    - PUT /api/user/balance
    - _Requirements: 3.1, 3.3_

- [-] 12. Integrate Frontend with Backend


  - [-] 12.1 Create API service for frontend

    - Create services/apiService.ts
    - Implement: login, getTransactions, getStats, addTransaction
    - _Requirements: 5.2, 5.4_
  - [x] 12.2 Update App.tsx to use backend API


    - Replace localStorage with API calls
    - Add authentication state management

    - _Requirements: 5.2, 5.4_
  - [x] 12.3 Add login page component

    - Create components/Login.tsx
    - Form with username and password fields

    - _Requirements: 5.4_
  - [ ] 12.4 Update Dashboard to fetch from API
    - Modify components/Dashboard.tsx to use apiService

    - Add polling for real-time updates (every 5 seconds)
    - _Requirements: 5.2, 5.3_
  - [x] 12.5 Update Settings for password change

    - Modify components/Settings.tsx
    - Add change password form
    - _Requirements: 8.4_

- [ ] 13. Implement OCR for Receipt Images (Optional)
  - [ ] 13.1 Create OCR service placeholder
    - Create src/services/ocrService.ts
    - Implement processImage() with Tesseract.js or Google Vision API
    - _Requirements: 6.1, 6.2_
  - [ ] 13.2 Integrate OCR with message router
    - Update messageRouter to handle image messages
    - Parse OCR result and create transaction
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
