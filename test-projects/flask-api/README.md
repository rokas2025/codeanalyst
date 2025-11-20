# Flask REST API

A well-structured Flask REST API with authentication, database integration, and comprehensive tests.

## Features

- 🔐 JWT Authentication
- 📊 SQLAlchemy ORM
- ✅ 85%+ test coverage
- 🔒 Security best practices
- 📝 Full API documentation
- 🐳 Docker support

## Installation

```bash
pip install -r requirements.txt
```

## Running

```bash
python app.py
```

## Testing

```bash
pytest --cov=app tests/
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users` - List users (authenticated)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
app/
├── models/      # Database models
├── routes/      # API routes
├── services/    # Business logic
├── utils/       # Utilities
└── tests/       # Unit tests
```

