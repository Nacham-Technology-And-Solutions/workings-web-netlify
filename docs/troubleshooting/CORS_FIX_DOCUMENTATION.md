# CORS Error Fix Documentation

## Problem
The application was experiencing CORS (Cross-Origin Resource Sharing) errors when making API requests from the Netlify-deployed frontend (`https://glazeworkings.netlify.app`) to the backend API (`https://glaze-workings-og75x.ondigitalocean.app`).

## Error Message
```
Access to XMLHttpRequest at 'https://glaze-workings-og75x.ondigitalocean.app/workings-api2/api/v1/auth/register' 
from origin 'https://glazeworkings.netlify.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
CORS is a browser security feature that blocks requests from one origin (domain) to another unless the server explicitly allows it. The backend API needs to be configured to allow requests from the Netlify frontend origin.

## Frontend Changes Made

### 1. Enhanced CORS Error Handling (`src/services/api/apiClient.ts`)
- Added detection for CORS errors in the response interceptor
- Provides user-friendly error messages when CORS errors occur
- Identifies network/CORS errors and provides helpful feedback

### 2. Improved Error Handler (`src/utils/errorHandler.ts`)
- Added CORS-specific error detection
- Maps CORS errors to user-friendly messages
- Provides detailed error information for debugging

### 3. Development Proxy Configuration (`vite.config.ts`)
- Added proxy configuration for local development
- Routes `/api` requests through Vite's dev server to avoid CORS issues during development
- Configure proxy target using `VITE_API_BASE_URL` environment variable

### 4. Netlify Configuration (`netlify.toml`)
- Created deployment configuration file
- Includes redirect rules for SPA routing
- Adds security headers
- Documents required environment variables

## Required Backend Configuration

**IMPORTANT:** The backend API server must be configured to allow CORS requests from the Netlify frontend.

### Backend CORS Configuration Required:
The backend needs to include the following CORS headers in responses:

```
Access-Control-Allow-Origin: https://glazeworkings.netlify.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, email
Access-Control-Allow-Credentials: true
```

### For Development (if testing locally):
```
Access-Control-Allow-Origin: http://localhost:3000
```

### For Production:
```
Access-Control-Allow-Origin: https://glazeworkings.netlify.app
```

Or to allow multiple origins:
```
Access-Control-Allow-Origin: https://glazeworkings.netlify.app, http://localhost:3000
```

## Environment Variables

### Required for Production (Netlify):
Set the following environment variable in Netlify dashboard:
- `VITE_API_BASE_URL`: `https://glaze-workings-og75x.ondigitalocean.app/workings-api2`

### For Local Development:
Create a `.env` file in the project root:
```
VITE_API_BASE_URL=http://localhost:5000
```

Or if using the proxy (recommended for development):
```
VITE_API_BASE_URL=http://localhost:3000
```

## Testing

### To Test CORS Fix:
1. **Backend**: Ensure CORS headers are properly configured
2. **Frontend**: Deploy to Netlify with correct `VITE_API_BASE_URL` environment variable
3. **Test**: Try registering/logging in from the deployed frontend
4. **Verify**: Check browser console for CORS errors (should be resolved)

## Files Modified

1. `src/services/api/apiClient.ts` - Enhanced CORS error detection
2. `src/utils/errorHandler.ts` - Improved CORS error handling
3. `vite.config.ts` - Added development proxy
4. `netlify.toml` - Created deployment configuration

## Additional Notes

- All API service files already use `apiClient` correctly - no changes needed
- The error handling improvements apply to all API calls automatically
- The proxy configuration only works in development mode
- Production requires proper backend CORS configuration

## Next Steps

1. **Backend Team**: Configure CORS headers on the API server to allow requests from `https://glazeworkings.netlify.app`
2. **DevOps**: Ensure `VITE_API_BASE_URL` environment variable is set in Netlify dashboard
3. **Testing**: Verify all API endpoints work correctly after backend CORS configuration

