# MiniLedger

**MiniLedger — A Mobile-Based Loan and Financial Management Application**

MiniLedger is a full-stack mobile application designed to help users manage loan-related information through a simple and accessible interface. It combines a React Native mobile application with a Node.js backend and a PostgreSQL database.

## Features

- **OTP-Based Authentication:** Verify users using a phone number and OTP.
- **Loan Management:** Access and manage loan-related information.
- **Financial Summary:** View summarized financial or loan information.
- **REST API:** Communicate between the mobile application and backend through API endpoints.
- **PostgreSQL Database:** Store application data in a relational database.
- **JWT Authentication:** Use JSON Web Tokens for authenticated API requests.
- **Cross-Platform Mobile Development:** Build and test the mobile application using Expo.
- **Modular Architecture:** Keep the frontend, backend, and database components organized separately.

## Technology Stack

| Component | Technology |
|---|---|
| Mobile Frontend | React Native |
| Mobile Development | Expo |
| Programming Language | TypeScript |
| Backend | Node.js and Express.js |
| Database | PostgreSQL |
| Authentication | OTP and JWT |
| API Communication | REST API |
| Database Connectivity | `pg` PostgreSQL client |

## Project Structure

```text
MiniLedger/
├── backend/
│   ├── src/
│   │   └── ...              # Backend source files
│   ├── sql/
│   │   └── schema.sql       # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                 # Backend environment variables
│
├── mobile/
│   ├── App.tsx              # Main mobile application
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                 # Mobile environment variables
│
└── README.md
```

*Note: The structure above is representative; the exact source-file organization may differ.*

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Android Studio with an Android Emulator, or a compatible mobile device
- Expo-compatible development environment
- Git (optional, for cloning the repository)

## Installation and Setup

### 1. Get the Project

If your project is available in a Git repository, clone it:

```bash
git clone <YOUR_REPOSITORY_URL>
cd MiniLedger
```

Alternatively, open the existing `C:\MiniLedger` project folder.

### 2. Configure the PostgreSQL Database

Create a PostgreSQL database named `miniledger`.

Using PostgreSQL or pgAdmin, execute the SQL script:

```text
backend/sql/schema.sql
```

This initializes the database schema required by the application.

### 3. Configure the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install
```

Create or update `backend/.env` with the appropriate local configuration:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger
JWT_SECRET=replace_with_a_secure_random_secret
```

Replace `YOUR_PASSWORD` with your PostgreSQL password. Use a strong, private value for `JWT_SECRET`.

If your existing backend uses separate PostgreSQL connection variables instead of `DATABASE_URL`, retain the variable names expected by its database configuration.

Start the backend:

```bash
npm run dev
```

The backend should be available at:

```text
http://localhost:5000
```

Test the health endpoint in a browser:

```text
http://localhost:5000/api/health
```

A successful response confirms that the API server is reachable.

### 4. Configure the Mobile Application

Open another terminal:

```bash
cd mobile
npm install
```

For an Android Emulator, configure `mobile/.env` as follows:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

**Important:** `10.0.2.2` allows the Android Emulator to access the host computer's localhost. Do not use `localhost` for the backend URL inside the Android Emulator.

For a physical Android device, replace `10.0.2.2` with your computer's local network IP address. Ensure both devices are connected to the same network and the firewall permits the connection.

If the API URL is hardcoded in `App.tsx`, make sure it matches the URL above. Expo environment-variable changes require restarting the development server.

### 5. Start the Mobile Application

From the `mobile` directory, run:

```bash
npx expo start --clear
```

Then:

1. Start your Android Emulator.
2. Press `a` in the Expo terminal to open the application.
3. Wait for the app to load.
4. Enter a phone number and request an OTP.
5. Check the backend terminal for the OTP if the current development implementation logs it there.
6. Enter the OTP to test authentication.

Keep the backend terminal running while using the mobile application.

## API Endpoints

The backend exposes REST API endpoints under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| POST | `/api/auth/send-otp` | Request an OTP |
| POST | `/api/auth/verify-otp` | Verify an OTP and authenticate |
| Loan-related routes | Defined in backend source | Manage loan information |
| Summary-related routes | Defined in backend source | Retrieve financial summaries |

### Example: Request an OTP

**Request**

```http
POST /api/auth/send-otp
Content-Type: application/json
```

```json
{
  "phone": "YOUR_PHONE_NUMBER"
}
```

The server processes the request and returns the response expected by the mobile application.

**Note:** The current development authentication flow uses a mock OTP that is logged in the backend terminal. This is intended for development and testing, not production authentication.

## Database

MiniLedger uses PostgreSQL to store its application data.

The database schema is maintained in:

```text
backend/sql/schema.sql
```

The Node.js backend connects to PostgreSQL using the `pg` package rather than requiring an ORM.

Make sure PostgreSQL is running and that the database credentials in the backend configuration are correct.

## Troubleshooting

### Network request failed

- Verify that the backend is running on port `5000`.
- Open `http://10.0.2.2:5000/api/health` in the Android Emulator browser.
- Check that the API URL in `App.tsx` or `mobile/.env` is correct.
- Restart Expo with `npx expo start --clear`.
- Check the backend terminal for incoming requests and errors.

### Database connection failed

- Confirm that PostgreSQL is running.
- Verify the database name, username, password, host, and port.
- Confirm that the `miniledger` database exists.
- Execute `backend/sql/schema.sql` if the schema has not been initialized.

### OTP verification failed

- Check the backend terminal for the development OTP.
- Confirm that the phone number and OTP are entered correctly.
- Check the backend response and authentication logic.

### TypeScript configuration warning

If TypeScript reports that `moduleResolution: "node"` is deprecated, review the existing `tsconfig.json` and the project's installed TypeScript version. Preserve the module settings required by the project rather than changing them blindly.

## Security Considerations

Before deploying MiniLedger for real users:

- Replace the mock OTP mechanism with a trusted OTP delivery provider.
- Store secrets in environment variables and never commit `.env` files.
- Use HTTPS for production API communication.
- Apply appropriate OTP expiration, retry limits, and rate limiting.
- Validate all incoming API requests.
- Secure JWT signing keys and configure appropriate token expiration.
- Protect sensitive financial information and restrict database access.
- Use aggregated or minimized data wherever appropriate.
- Avoid logging OTPs, passwords, tokens, or other sensitive information in production.

## Future Enhancements

Potential improvements include:

- Integration with an actual SMS-based OTP service.
- Enhanced loan tracking and repayment history.
- Detailed financial dashboards and analytics.
- Notifications and payment reminders.
- Improved input validation and error handling.
- Automated backend and mobile application tests.
- Production deployment and monitoring.

## Development Status

MiniLedger is a development project with a React Native frontend, Express backend, PostgreSQL database, and OTP/JWT authentication flow. Features and deployment readiness should be verified against the current implementation.

## License

No license has been specified yet. Add an appropriate license before distributing the project publicly.
