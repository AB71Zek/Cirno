# Cirno Chat API Backend

A REST API backend for the Cirno chat application using Google's Gemini AI.

## Environment Configuration

1. **Create a `.env` file** in the backend directory:
   ```bash
   copy .env.example .env
   ```

2. **Get your Google API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Copy the API key

3. **Update the `.env` file** with your actual API key:
   ```
   GOOGLE_API_KEY=your_actual_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

## Running the Server

```bash
npm start
```

The server will run on port 5000 by default (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- **GET** `/` - Check if the API is running and Gemini is configured
- **Response**: `{ message, status, gemini_configured }`

### Chat
- **POST** `/api/chat` - Send a message to Gemini AI
- **Body**: `{ message: "Your message here" }`
- **Response**: `{ success: true, message: "AI response", timestamp }`

### Problem Solver (Math Tutor)
- **POST** `/api/problem-solver` - Specialized math tutor mode
- **Body**: `{ message: "Math problem or question" }`
- **Response**: `{ success: true, message: "Tutor response", mode: "problem_solver", timestamp }`
- **Features**: 
  - Identifies grade level and explains problems
  - Provides hints when asked
  - Gives step-by-step solutions
  - Explains mathematical terms

### Models
- **GET** `/api/models` - Get available Gemini models and modes
- **Response**: `{ success: true, models: [...], modes: [...] }`

## Example Usage

```javascript
// Send a chat message
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});
const data = await response.json();
console.log(data.message); // AI response
```

```javascript
// Use math tutor mode
const response = await fetch('http://localhost:5000/api/problem-solver', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Solve: 2x + 5 = 13' })
});
const data = await response.json();
console.log(data.message); // Math tutor response
```

## Testing

Test the API endpoints:
```bash
node test-api.js
```

## Important Notes

- Never commit your `.env` file to version control
- The `.env.example` file shows the required environment variables
- Make sure to keep your Google API key secure and private
- The API uses CORS for frontend integration
