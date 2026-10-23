# MiniLedger

A mobile app to track money lent to friends. Built with Expo/React Native, Express/TypeScript and PostgreSQL via `pg` (no ORM).

## Requirements
- Node.js 20+
- PostgreSQL 14+
- Expo Go or an emulator

## 1. Database
Create a PostgreSQL database named `miniledger`, then from the project root run:

```bash
psql -U postgres -d miniledger -f backend/sql/schema.sql
```

You can instead execute `backend/sql/schema.sql` in pgAdmin's Query Tool connected to `miniledger`.

## 2. Backend
```bash
cd backend
```
Copy `.env.example` to `.env`, then set your PostgreSQL password and a private JWT secret. Example:

```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger
JWT_SECRET=use_a_long_random_secret_at_least_32_chars
OTP_TTL_MINUTES=5
```

Then run:
```bash
npm install
npm run dev
```
Check http://localhost:5000/api/health. You should see `PostgreSQL connected successfully` in the terminal.

Login uses a mock six-digit OTP. Tap Send OTP in the app, then read the OTP from the backend terminal. No SMS is sent.

## 3. Mobile app
In a second terminal:
```bash
cd mobile
npm install
```
Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`:
- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:5000/api` (same Wi-Fi; allow port 5000 through firewall)

Start Expo:
```bash
npx expo start
```
Scan the QR code with Expo Go. The backend must be running at the same time.

## Tests and build
```bash
cd backend
npm test
npm run build
```
The included automated test checks the health endpoint. Test database-backed features manually or add integration tests against a separate test database.

## API
All routes start with `/api`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | API health |
| POST | `/auth/send-otp` | No | Generate OTP and log it server-side |
| POST | `/auth/verify-otp` | No | Verify OTP and return JWT |
| GET | `/loans` | Bearer token | List own loans |
| POST | `/loans` | Bearer token | Create loan |
| PATCH | `/loans/:id/repay` | Bearer token | Mark own pending loan repaid |
| DELETE | `/loans/:id` | Bearer token | Delete own loan |
| GET | `/summary` | Bearer token | Summary totals |

Summary definitions: total lent is all loans; total repaid is loans marked `REPAID`; overdue is `PENDING` loans with due date before today.

## Notes
- OTP records are held in memory and reset on server restart. This is mock authentication for the assignment, not production-ready SMS authentication.
- SQL is parameterized with `$1`, `$2`, etc. Every loan query is scoped to the authenticated user.
- `NUMERIC(12,2)` is used for currency amounts.
- Receipt upload is not implemented; `receipt_url` is reserved for a future bonus feature.
- Never commit `.env` or production secrets.

## Demo recording plan (2–3 minutes)
1. Request OTP and show it in backend terminal.
2. Log in and show the summary card.
3. Add a loan with a past due date and show overdue styling.
4. Add another loan and mark a pending loan as repaid.
5. Show updated summary and README/repository.
