# Tensor School ERP - Enterprise Backend System

Enterprise-grade backend system for Tensor School ERP application built with Node.js, Express.js, and Supabase.

## Features

- 🔐 Secure JWT authentication with bcrypt password hashing
- 🛡️ Role-based access control (RBAC)
- ✅ Comprehensive input validation using Joi
- 🚦 Rate limiting for DDoS protection
- 📝 Structured logging with Winston
- 💾 In-memory caching with node-cache
- 📊 API documentation with Swagger/OpenAPI
- 🧪 Testing infrastructure (unit, integration, property-based)
- 🔄 Graceful shutdown handling
- 🌐 CORS configuration
- 📈 Health check endpoints

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Caching**: node-cache
- **Testing**: Jest + Supertest + fast-check
- **Documentation**: Swagger UI

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
   - Set your Supabase URL and service key
   - Generate a secure JWT secret (minimum 32 characters)
   - Configure other settings as needed

## Configuration

### Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `JWT_SECRET`: Secret key for JWT signing (min 32 chars)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Optional Environment Variables

See `.env.example` for all available configuration options with descriptions.

## Running the Application

### Development Mode
```bash
npm run dev
```
Runs the server with nodemon for auto-restart on file changes.

### Production Mode
```bash
npm start
```
Runs the server in production mode.

## Testing

### Run All Tests
```bash
npm test
```

### Run Unit Tests
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Property-Based Tests
```bash
npm run test:property
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.js      # Main config loader with validation
│   │   ├── database.js   # Supabase client configuration
│   │   ├── cache.js      # Cache configuration
│   │   └── logger.js     # Winston logger configuration
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic layer
│   ├── routes/           # API route definitions
│   ├── models/           # Data models and schemas
│   ├── utils/            # Utility functions
│   └── docs/             # API documentation
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── property/         # Property-based tests
├── logs/                 # Log files (auto-generated)
├── .env                  # Environment variables (gitignored)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
└── jest.config.js        # Test configuration
```

## API Documentation

Once the server is running, API documentation is available at:
- Swagger UI: `http://localhost:3000/api-docs` (coming soon)

## Health Check

Check system health at:
```
GET /health
```

## Logging

Logs are written to:
- Console (formatted for readability)
- `logs/application-YYYY-MM-DD.log` (all logs)
- `logs/error-YYYY-MM-DD.log` (errors only)
- `logs/exceptions-YYYY-MM-DD.log` (uncaught exceptions)
- `logs/rejections-YYYY-MM-DD.log` (unhandled rejections)

Logs are automatically rotated daily and retained for 30 days.

## Security Best Practices

1. **Never commit** `.env` files with real credentials
2. Use strong JWT secrets (minimum 32 characters)
3. Keep Supabase service key secure
4. Configure CORS properly for your frontend domains
5. Use HTTPS in production
6. Regularly update dependencies
7. Review and adjust rate limiting settings

## Development Guidelines

1. Follow the existing code structure
2. Write tests for new features
3. Use meaningful commit messages
4. Keep functions small and focused
5. Document complex logic
6. Handle errors appropriately
7. Log important operations

## Troubleshooting

### Configuration Errors
If you see "Configuration validation failed", check that:
- All required environment variables are set
- JWT_SECRET is at least 32 characters
- SUPABASE_URL is a valid URL
- Environment variable types are correct

### Database Connection Issues
- Verify Supabase URL and service key
- Check network connectivity
- Ensure Supabase project is active

### Port Already in Use
Change the PORT in `.env` file or stop the process using the port.

## License

Proprietary - Tensor School ERP

## Support

For issues and questions, contact the development team.
