# Security Implementation - EduQuest AI

## Credit System Security

### Problem
The previous implementation stored user credits in `localStorage`, which was a major security vulnerability. Users could easily manipulate their credit count through browser developer tools, giving themselves unlimited generations.

### Solution
We've implemented a secure server-side credit management system with the following features:

## Server-Side Session Management

### 1. Encrypted Sessions
- User credits are stored on the server, not in the browser
- Session IDs are encrypted using AES-256-CBC encryption
- Sessions are transmitted via secure HTTP-only cookies

### 2. Session Security Features
- **HttpOnly Cookies**: Cannot be accessed via JavaScript, preventing XSS attacks
- **Encrypted Session IDs**: Session data is encrypted before being stored in cookies
- **Secure Flag**: Cookies are only sent over HTTPS in production
- **SameSite Protection**: Prevents CSRF attacks
- **Automatic Expiration**: Sessions expire after 24 hours of inactivity

### 3. API Endpoints
- `GET /api/session/credits` - Retrieve current credit status
- `POST /api/session/credits` - Manage credits (decrement, reset, API key status)

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Session Security (REQUIRED)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your_super_secret_session_key_change_this_in_production

# Environment
NODE_ENV=development
```

## How It Works

### 1. Session Creation
- When a user first visits, a secure session is created server-side
- Session contains: credits (4), hasLocalApiKey status, timestamps
- Encrypted session ID is stored in HTTP-only cookie

### 2. Credit Management
- All credit operations happen server-side
- Client can only request credit changes through authenticated API calls
- Credits cannot be manipulated client-side

### 3. API Key Integration
- User API keys are still stored locally (for privacy)
- Server tracks whether user has local API key (unlimited usage)
- When local API key is set, credits aren't decremented

### 4. Security Benefits
- **Tamper-proof**: Credits cannot be modified by users
- **Session-based**: Each browser session gets independent credit tracking
- **Encrypted**: All session data is encrypted before storage
- **Automatic cleanup**: Sessions expire and are cleaned up automatically

## Production Considerations

### 1. Session Storage
Current implementation uses in-memory storage. For production:
- Use Redis for session storage
- Use a proper database for user management
- Implement user authentication

### 2. Security Enhancements
- Add rate limiting to prevent abuse
- Implement proper user authentication
- Add monitoring and logging
- Use HTTPS everywhere

### 3. Scaling
- Sessions are currently stored in memory
- For multiple server instances, use shared session storage (Redis)
- Consider implementing proper user accounts with database storage

## Migration Notes

### Client-Side Changes
- Credit store now syncs with server on hydration
- All credit operations are now async
- LocalStorage only stores API key data (not credits)

### API Changes
- All generation endpoints check server-side credits
- Credit validation happens before API calls
- Error handling for credit exhaustion

### Backward Compatibility
- Existing API key functionality preserved
- Smooth transition from localStorage to server-side
- No breaking changes for users

## Testing

### Development
- Reset functionality available in development mode
- Credits reset to 4 for testing purposes
- Full error handling and logging

### Production
- Reset functionality disabled
- Secure session management
- Proper error handling without sensitive data exposure 