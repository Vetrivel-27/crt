# Complaint Resolution Tracker - Backend

Backend API for the Complaint Resolution Tracker system built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crt_db;

# Exit psql
\q
```

Run the schema file to create tables:

```bash
psql -U postgres -d crt_db -f src/database/schema.sql
```

### 3. Environment Configuration

Copy the example environment file and update with your credentials:

```bash
copy .env.example .env
```

Edit `.env` and update the following:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crt_db
DB_USER=postgres
DB_PASSWORD=your_actual_password

JWT_SECRET=your_secure_random_secret_key
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

### 4. Create Default Admin User

The schema file includes a default admin user. To create a proper admin with a secure password, run:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

Then update the admin user in the database:

```sql
UPDATE users SET password_hash = '<generated_hash>' WHERE email = 'admin@crt.edu';
```

Or create a new admin via the API after starting the server.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in .env).

## API Endpoints

### Authentication

- `POST /auth/register` - Register new student
- `POST /auth/login` - Login (all roles)
- `POST /auth/logout` - Logout

### Student Endpoints

- `GET /api/student/complaints` - Get student's complaints
- `POST /api/student/complaints` - Create new complaint
- `GET /api/student/complaints/:id` - Get complaint details
- `POST /api/student/complaints/:id/feedback` - Submit feedback

### Worker Endpoints

- `GET /api/worker/complaints` - Get assigned complaints
- `GET /api/worker/stats` - Get worker statistics
- `GET /api/worker/complaints/:id` - Get complaint details
- `PUT /api/worker/complaints/:id/status` - Update complaint status
- `POST /api/worker/complaints/:id/notes` - Add note
- `PUT /api/worker/complaints/:id/reassign` - Reassign complaint

### Admin Endpoints

- `GET /api/admin/overview` - Dashboard analytics
- `GET /api/admin/complaints` - Get all complaints
- `PUT /api/admin/complaints/:id/assign` - Assign complaint
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Testing

Test the API health:

```bash
curl http://localhost:5000/health
```

Test registration:

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Student\",\"email\":\"test@example.com\",\"password\":\"password123\",\"studentId\":\"S12345\"}"
```

## AI Service Integration

The backend includes a mock AI service (`src/services/aiService.js`) that provides:

- Complaint classification (category, urgency)
- Routing suggestions
- Summarization
- Analytics insights

To integrate real AI services:

1. Update the AI service URLs in `.env`
2. Set `useMock = false` in `aiService.js` or configure via environment
3. Implement the actual API calls in the service methods

## Project Structure

```
crt-backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   └── jwt.js           # JWT configuration
│   ├── database/
│   │   └── schema.sql       # Database schema
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   ├── roleCheck.js     # Role-based authorization
│   │   ├── validation.js    # Input validation
│   │   └── errorHandler.js  # Error handling
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── student.js       # Student routes
│   │   ├── worker.js        # Worker routes
│   │   └── admin.js         # Admin routes
│   ├── services/
│   │   └── aiService.js     # AI integration service
│   └── server.js            # Main application
├── .env.example             # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Security Notes

- Always use strong JWT secrets in production
- Use HTTPS in production
- Implement rate limiting for production
- Regularly update dependencies
- Use environment variables for sensitive data
- Implement proper password policies

## License

ISC
