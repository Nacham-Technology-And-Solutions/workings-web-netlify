# Logging System Documentation

## Overview

A comprehensive logging system has been implemented to track all API requests, responses, errors, and authentication events. Logs persist in localStorage and survive page redirects, making them invaluable for debugging authentication issues.

## Features

### 1. Persistent Storage
- Logs are stored in `localStorage` under the key `app_logs`
- Logs survive page redirects and reloads
- Automatic log rotation (keeps last 1000 logs)
- Automatic cleanup when localStorage is full

### 2. Comprehensive Logging
- **API Requests**: Method, URL, headers, data
- **API Responses**: Status, duration, response data
- **API Errors**: Full error details, stack traces
- **Authentication Events**: Login, logout, token refresh, redirects
- **CORS Errors**: Network and CORS-related issues

### 3. Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information (requests, responses)
- **WARN**: Warnings (401s, redirects)
- **ERROR**: Errors (failed requests, token refresh failures)

### 4. Security
- Sensitive data is automatically sanitized
- Passwords, tokens, and API keys are masked
- Headers are sanitized before logging

## Usage

### Accessing Logs

#### Method 1: Keyboard Shortcut (Development Only)
Press `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac) to open the log viewer.

#### Method 2: Programmatic Access
```typescript
import logger from '@/utils/logger';

// Get all logs
const allLogs = logger.getLogs();

// Get logs by level
const errors = logger.getLogs(LogLevel.ERROR);

// Get logs by category
const authLogs = logger.getLogs(undefined, 'AUTH');

// Get last 100 logs
const recentLogs = logger.getLogs(undefined, undefined, 100);
```

### Log Viewer Features

The log viewer provides:
- **Filtering**: By level, category, or search query
- **Auto-refresh**: Automatically updates every second
- **Export**: Export logs as JSON or text file
- **Clear**: Clear all logs
- **Statistics**: View log counts by level and category

### Exporting Logs

#### Export as JSON
```typescript
const jsonLogs = logger.exportLogs();
// Returns JSON string of all logs
```

#### Export as Text
```typescript
const textLogs = logger.getLogsAsText(LogLevel.ERROR, 'AUTH');
// Returns formatted text string
```

#### Via Log Viewer UI
- Click "Export JSON" to download as JSON file
- Click "Export Text" to download as text file

## Log Categories

- **API_REQUEST**: All outgoing API requests
- **API_RESPONSE**: All API responses
- **API_ERROR**: All API errors
- **AUTH**: Authentication events (login, logout, token refresh)
- **REDIRECT**: Page redirects
- **LOGGER**: Logger system events

## Example Log Entries

### API Request
```json
{
  "id": "1234567890-abc123",
  "timestamp": 1704067200000,
  "level": "INFO",
  "category": "API_REQUEST",
  "message": "GET /api/v1/projects",
  "data": {
    "method": "GET",
    "url": "/api/v1/projects",
    "headers": {
      "Authorization": "Bearer ***",
      "email": "***@***"
    }
  }
}
```

### Authentication Event
```json
{
  "id": "1234567890-def456",
  "timestamp": 1704067201000,
  "level": "INFO",
  "category": "AUTH",
  "message": "User logged in successfully",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "subscriptionStatus": "pro"
  }
}
```

### Error
```json
{
  "id": "1234567890-ghi789",
  "timestamp": 1704067202000,
  "level": "ERROR",
  "category": "API_ERROR",
  "message": "GET /api/v1/projects - 401",
  "data": {
    "method": "GET",
    "url": "/api/v1/projects",
    "error": {
      "message": "Unauthorized",
      "status": 401
    }
  },
  "stack": "Error: Unauthorized\n    at ..."
}
```

## Configuration

### Maximum Logs
Default: 1000 logs
- When limit is reached, oldest logs are automatically removed
- Can be adjusted in `src/utils/logger.ts`:
  ```typescript
  const MAX_LOGS = 1000; // Change this value
  ```

### Enable/Disable Logging
```typescript
logger.setEnabled(false); // Disable logging
logger.setEnabled(true);  // Enable logging
```

## Integration Points

### API Client (`src/services/api/apiClient.ts`)
- Logs all requests with method, URL, headers
- Logs all responses with status and duration
- Logs all errors with full details
- Logs authentication events (token refresh, redirects)

### Auth Store (`src/stores/authStore.ts`)
- Logs successful logins
- Logs logout events

### Components
- Logs can be added to any component:
  ```typescript
  import logger from '@/utils/logger';
  
  logger.info('COMPONENT', 'User action performed', { action: 'click' });
  ```

## Best Practices

1. **Use Appropriate Log Levels**
   - DEBUG: Detailed debugging info
   - INFO: Normal operations
   - WARN: Potential issues
   - ERROR: Actual errors

2. **Use Descriptive Categories**
   - Group related logs together
   - Use consistent naming (e.g., all caps)

3. **Don't Log Sensitive Data**
   - Logger automatically sanitizes, but be careful
   - Never log passwords, tokens, or API keys directly

4. **Clear Logs Regularly**
   - Use the log viewer to clear old logs
   - Or programmatically: `logger.clearLogs()`

## Troubleshooting

### Logs Not Appearing
1. Check if logging is enabled: `logger.isLoggingEnabled()`
2. Check localStorage quota (logs might be too large)
3. Check browser console for errors

### localStorage Full
- Logger automatically clears 50% of oldest logs
- Manually clear logs: `logger.clearLogs()`
- Reduce MAX_LOGS value

### Performance Impact
- Logging is asynchronous and shouldn't block
- If performance issues occur, disable logging in production:
  ```typescript
  if (import.meta.env.PROD) {
    logger.setEnabled(false);
  }
  ```

## Files Modified

1. `src/utils/logger.ts` - Core logging utility
2. `src/services/api/apiClient.ts` - Integrated logging
3. `src/stores/authStore.ts` - Added auth event logging
4. `src/components/common/LogViewer.tsx` - Log viewer UI component
5. `src/app/App.tsx` - Added log viewer with keyboard shortcut
6. `src/utils/index.ts` - Exported logger

## Future Enhancements

- [ ] Remote log aggregation
- [ ] Log compression for storage
- [ ] Real-time log streaming
- [ ] Log search with advanced filters
- [ ] Performance metrics logging
- [ ] User action tracking

