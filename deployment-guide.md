# SmartShoe Deployment Guide

## Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL (for production)

## Backend Deployment

### 1. Environment Setup
Create `.env` file in backend folder:
```env
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=postgresql://user:password@localhost/smartshoe