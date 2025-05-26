# API Documentation

## Base URL
http://localhost:5000/api

## Authentication

### Login
- **POST** `/auth/login`
- Body: `{ "username": "string", "password": "string" }`
- Returns: `{ "access_token": "string", "user": {...} }`

### Register
- **POST** `/auth/register`
- Body: `{ "username": "string", "password": "string", "email": "string" }`

## Products

### Get All Products
- **GET** `/products`
- Headers: `Authorization: Bearer {token}`

### Add Product
- **POST** `/products`
- Headers: `Authorization: Bearer {token}`
- Body: Product object

... (add more endpoints)
