# Register Manager API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<p align="center">
  Backend API for managing course registrations and payments
  <br>
  Built with <a href="http://nestjs.com" target="_blank">NestJS</a>, <a href="https://www.prisma.io" target="_blank">Prisma</a>, and <a href="https://www.postgresql.org" target="_blank">PostgreSQL</a>
</p>

## 📋 Description

Register Manager API is a full-featured backend application for managing course registrations. It provides a complete system for authentication, user management, course management, registrations, and payments.

### ✨ Key Features

- 🔐 **Full authentication** with JWT, refresh tokens, and email verification
- 👥 **User management** with role-based access control (SUPER_ADMIN, ADMIN, USER)
- 📚 **Course management** with detailed course information
- 📝 **Registration system** with status tracking
- 💳 **Payment processing** with multi-currency support (USD, EUR, XOF) via FedaPay
- 📧 **Email service** for notifications, verification, and password resets
- 🔄 **WhatsApp integration** for communications
- 🛡️ **Rate limiting** and advanced security
- 🧪 **Comprehensive tests** with 100% coverage on core modules

## 🏗️ Project Architecture

### Tech Stack

| Technology     | Version  | Purpose                        |
|----------------|----------|--------------------------------|
| **NestJS**     | ^11.0.1  | Node.js TypeScript framework   |
| **Prisma**     | ^6.15.0  | Database ORM                   |
| **PostgreSQL** | 15       | Relational database            |
| **JWT**        | ^11.0.0  | Token-based authentication     |
| **Bcrypt**     | ^6.0.0   | Password hashing               |
| **Nodemailer** | ^7.0.6   | Email delivery service         |
| **Jest**       | ^29.7.0  | Testing framework              |
| **Docker**     | -        | Database containerization      |

### Module Structure

```
src/
├── auth/               # Authentication module
│   ├── dto/            # Data transfer objects
│   ├── guards/         # Security guards
│   └── services/       # Business logic
├── user/               # User management
├── admin/              # Admin operations
├── course/             # Course management
├── registration/       # Registration system
├── payment/            # Payment processing
├── mail/               # Email service
├── whatsapp/           # WhatsApp integration
├── common/             # Shared utilities, filters, interfaces
└── main.ts             # Application entry point
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (bundled with Node.js)
- **PostgreSQL** (or Docker for the bundled database)
- **Git**

### Automated Setup

```bash
# Clone the repository
git clone https://github.com/Romaric-py/register-manager-api.git
cd register-manager-api

# Run the initialization script
./init.sh
```

The `init.sh` script automates:
- ✅ Prerequisites check
- ✅ Dependency installation
- ✅ Environment configuration
- ✅ Database startup (Docker)
- ✅ Prisma client generation
- ✅ Database migrations
- ✅ Initial data seeding
- ✅ Project build

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL (with Docker)
docker-compose up -d manager-db

# 4. Generate Prisma client
npx prisma generate

# 5. Apply migrations
npx prisma migrate deploy

# 6. Seed initial data
npm run seed

# 7. Build the project
npm run build
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the values:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5434/mydb

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRY=1800000   # 30 minutes (ms)
JWT_REFRESH_TOKEN_EXPIRY=604800000  # 7 days (ms)

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3001

# Super Admin credentials (used during seeding)
SUPER_ADMIN_EMAIL=admin@registerManager.com
SUPER_ADMIN_PASSWORD=AdminPassword123!
```

📖 **Full documentation**: See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### Database

#### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL
docker-compose up -d manager-db

# Check status
docker-compose ps
```

#### Option 2: Local PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Create database and update DATABASE_URL in .env
createdb mydb
```

## 🏃‍♂️ Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API is available at `http://localhost:3000`.

## 📡 API Endpoints

### Authentication

| Method | Endpoint                             | Description                     | Auth |
|--------|--------------------------------------|---------------------------------|------|
| POST   | `/auth/register`                     | Register a new user             | –    |
| POST   | `/auth/login`                        | Login                           | –    |
| POST   | `/auth/logout`                       | Logout                          | JWT  |
| POST   | `/auth/verify-email`                 | Verify email address            | –    |
| POST   | `/auth/resend-verification-email`    | Resend verification email       | –    |
| POST   | `/auth/request-password-reset`       | Request password reset          | –    |
| POST   | `/auth/reset-password`               | Reset password with token       | –    |
| POST   | `/auth/create-admin`                 | Create an admin account         | SUPER_ADMIN |

### Courses

| Method | Endpoint                   | Description              | Auth       |
|--------|----------------------------|--------------------------|------------|
| POST   | `/course`                  | Create a course          | SUPER_ADMIN |
| GET    | `/course`                  | List all courses         | SUPER_ADMIN |
| GET    | `/course/stats`            | Course statistics        | SUPER_ADMIN |
| GET    | `/course/:id`              | Get course details       | SUPER_ADMIN |
| PATCH  | `/course/:id`              | Update a course          | SUPER_ADMIN |
| PATCH  | `/course/:id/toggle-active`| Toggle active status     | SUPER_ADMIN |
| DELETE | `/course/:id`              | Delete a course          | SUPER_ADMIN |

### Registrations

| Method | Endpoint                        | Description                              | Auth    |
|--------|---------------------------------|------------------------------------------|---------|
| POST   | `/registration`                 | Register for a course                    | JWT     |
| POST   | `/registration/many-for-one`    | Register a user to multiple courses      | JWT     |
| POST   | `/registration/one-for-many`    | Register multiple users to one course    | JWT     |
| GET    | `/registration/me`              | Current user's registrations             | JWT     |
| GET    | `/registration/all`             | All registrations                        | ADMIN+  |
| GET    | `/registration/:id`             | Get registration details                 | JWT     |
| PATCH  | `/registration/:id`             | Update a registration                    | ADMIN+  |
| DELETE | `/registration/:id`             | Cancel a registration                    | JWT     |

### Payments

| Method | Endpoint                      | Description                  | Auth |
|--------|-------------------------------|------------------------------|------|
| POST   | `/payment/generate-link`      | Generate a payment link      | JWT  |
| GET    | `/payment/available-amounts`  | Get available payment amounts| JWT  |
| POST   | `/payment/callback`           | Payment callback handler     | –    |

### Default Admin Account

After running the seed, a super admin account is created:
- **Email**: `admin@registerManager.com`
- **Password**: `AdminPassword123!`

⚠️ **Change these credentials before going to production!**

## 🧪 Testing

```bash
# All unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e

# Test a specific module
npm test auth
npm test registration
```

### Current Coverage

- **Auth module**: 100% coverage
- **Registration module**: Comprehensive unit and integration tests
- **E2E tests**: Coverage for all major endpoints

## 🔒 Security

- **JWT** access & refresh tokens with configurable expiry
- **Bcrypt** password hashing
- **Rate limiting** (configurable via `THROTTLER_*` env vars)
- **Input validation** with `class-validator`
- **CORS** with configurable allowed origins
- **Role-based guards** for route authorization
- **Prisma exception filters** for safe error handling

## 📦 npm Scripts

| Script                  | Description                       |
|-------------------------|-----------------------------------|
| `npm run start`         | Start the application             |
| `npm run start:dev`     | Start in development (watch) mode |
| `npm run start:prod`    | Start in production mode          |
| `npm run build`         | Compile TypeScript                |
| `npm run test`          | Run unit tests                    |
| `npm run test:cov`      | Run tests with coverage report    |
| `npm run test:e2e`      | Run end-to-end tests              |
| `npm run lint`          | Lint and auto-fix code            |
| `npm run format`        | Format code with Prettier         |
| `npm run seed`          | Reset database with initial data  |

## 🐳 Docker

```bash
# Start only the PostgreSQL database
docker-compose up -d manager-db

# Stop all containers
docker-compose down

# View database logs
docker-compose logs -f manager-db
```

## 📊 Database

### Data Models

- **User** – Email, hashed password, phone, role, email verification, password reset tokens
- **Course** – Title, description, price, duration, dates, location, prerequisites, objectives
- **Registration** – Links users to courses with status (PENDING / CONFIRMED / CANCELLED / COMPLETED)
- **Payment** – Payment records with status (PENDING / COMPLETED / FAILED / REFUNDED), currency (USD / EUR / XOF)
- **RefreshToken** – JWT refresh token storage
- **ContactMessage** – Contact form submissions

### Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name "description"

# Apply pending migrations
npx prisma migrate deploy

# Reset the database
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

## 🚀 Deployment

### Production Requirements

- Node.js 18+
- PostgreSQL database
- Secure environment variables
- Configured SMTP service
- Domain with HTTPS

### Production Environment Variables

```bash
NODE_ENV=production
JWT_SECRET=ultra-secure-secret
DATABASE_URL=postgresql://user:password@prod-db:5432/dbname
FRONTEND_URL=https://your-domain.com
MAIL_HOST=your-smtp-server.com
```

### Deploy Commands

```bash
# Build
npm run build

# Start
npm run start:prod

# With PM2 (recommended)
pm2 start dist/main.js --name register-manager-api
```

## 🆘 Troubleshooting

### Database connection errors

```bash
# Check container status
docker-compose ps
docker-compose logs manager-db

# Restart the database
docker-compose down
docker-compose up -d manager-db
```

### Prisma errors

```bash
# Regenerate the client
npx prisma generate

# Reapply migrations
npx prisma migrate reset
```

### Build errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🤝 Contributing

1. **Fork** the project
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Standards

- **ESLint**: Strict TypeScript configuration
- **Prettier**: Automatic code formatting
- **Tests**: Coverage required for new code

## 📄 License

This project is **UNLICENSED** — see [package.json](./package.json) for details.

## 📞 Contact

- **Repository**: [https://github.com/Romaric-py/register-manager-api](https://github.com/Romaric-py/register-manager-api)

---

<p align="center">
  Built with ❤️ and <a href="http://nestjs.com" target="_blank">NestJS</a>
</p>
