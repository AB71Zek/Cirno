# Cirno Backend API

A Node.js/Express backend API for the Cirno math tutoring chatbot, powered by Google's Gemini AI and Firebase Firestore.

## Features

- **Math Problem Solver**: AI-powered math tutoring using Gemini 2.5 Flash Lite
- **Conversation Management**: Persistent conversation history with Firebase Firestore
- **Session Management**: Secure session handling with cookies
- **Image Processing**: Support for math problem images with compression
- **RESTful API**: Clean API endpoints for frontend integration

## Prerequisites

- Node.js (v22)
- npm or yarn
- Firebase project with Firestore enabled
- Google Cloud CLI (gcloud) installed and authenticated
- Service account with appropriate permissions

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see Environment Variables section below)

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend root directory with the following variables:

### Required Variables

```env
# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=./config/cirno-firebase-adminsdk.json

# Server Configuration
PORT=5000
NODE_ENV=development
```
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firestore Database
4. Set up Firestore security rules (see Security Rules section)

### 2. Generate Service Account Key

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `cirno-firebase-adminsdk.json`
5. Place it in the `config/` directory

## Google Cloud Setup

### 1. Create Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project:**
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "cirno-backend")
   - Click "Create"

### 2. Enable Required APIs

1. **Go to APIs & Services → Library**
2. **Enable the following APIs:**
   - **Firebase Admin API**: Search "Firebase Admin API" → Enable
   - **AI Platform API**: Search "AI Platform API" → Enable  
   - **Vertex AI API**: Search "Vertex AI API" → Enable

### 3. Create Service Account

1. **Go to IAM & Admin → Service Accounts**
2. **Click "Create Service Account"**
3. **Fill in details:**
   - **Name**: `cirno-backend`
   - **Description**: `Service account for Cirno backend API`
   - Click "Create and Continue"

4. **Grant roles:**
   - **Role 1**: `Firebase Admin` (search and select)
   - **Role 2**: `AI Platform User` (search and select)
   - Click "Continue" → "Done"

### 4. Generate Service Account Key

1. **Find your service account** in the list
2. **Click the service account email**
3. **Go to "Keys" tab**
4. **Click "Add Key" → "Create new key"**
5. **Select "JSON" format**
6. **Click "Create"** (file will download automatically)
7. **Rename the file** to `cirno-firebase-adminsdk.json`
8. **Move it** to your backend `config/` directory

## Development

### Project Structure
```
backend/
├── config/                 # Firebase credentials
├── routes/                 # API route handlers
│   └── conversation.js
├── services/               # Business logic
│   ├── conversationService.js
│   ├── firebase.js
│   └── gemini.js
├── utils/                  # Utility functions
│   ├── imageProcessor.js
│   └── sessionManager.js
├── uploads/                # File uploads (if needed)
├── .env                    # Environment variables
├── package.json
└── server.js              # Main server file
```

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Install dependencies
npm install
```

### Dependencies

**Core Dependencies:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `cookie-parser` - Cookie parsing middleware
- `multer` - File upload handling
- `sharp` - Image processing
- `firebase-admin` - Firebase SDK
- `@google/genai` - Google AI SDK

**Development Dependencies:**
- `nodemon` - Auto-reload for development
- `dotenv` - Environment variable loading