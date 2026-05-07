# Backend - Hospital Management System

This is the backend for the Hospital Management System, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v18+)
- MongoDB (Atlas or local)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in this directory and add the following (see `.env.example`):

```env
PORT=5000
MONGO_URI=your_mongodb_uri
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
GEMINI_KEY=your_gemini_api_key
UPLOADTHING_TOKEN=your_uploadthing_token
```

## Running the Server

### Development Mode

Runs the server with auto-reload:

```bash
npm run dev
```

### Production Mode

```bash
npm run start
```
