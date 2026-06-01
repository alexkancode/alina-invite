# Error Handling Failures

Documentation for poor observability patterns and debugging blind spots in backend systems.

## Debugging Blind Spots

### Problem Description
Generic error responses provide no actionable information for debugging, making it extremely difficult to identify and resolve root causes. This becomes especially problematic in **Infrastructure Configuration Drift** scenarios where multiple system layers are misaligned.

### Common Symptoms

**Generic 500 Errors:**
```javascript
// ❌ No useful information
try {
  await performComplexOperation();
} catch (error) {
  return res.status(500).json({ error: 'Internal server error' });
}
```

**Lost Error Context:**
```javascript
// ❌ Original error information discarded
try {
  const result = await database.query(complexQuery);
  return processResult(result);
} catch (error) {
  console.log('Database error occurred');  // No details
  throw new Error('Processing failed');     // Original cause lost
}
```

**No Error Correlation:**
```javascript
// ❌ No way to correlate errors across service boundaries
app.post('/api/upload', async (req, res) => {
  try {
    await fileService.validate(req.file);
    await database.store(req.file);
    await notificationService.notify(req.user);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
    // Which service failed? No correlation ID to trace
  }
});
```

### Solutions

**Comprehensive Error Logging:**
```javascript
// ✅ Specific error information with context
try {
  await performComplexOperation();
} catch (error) {
  console.error('Complex operation failed:', {
    operation: 'performComplexOperation',
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context: { userId, requestId, operation: 'file-upload' }
  });
  
  return res.status(500).json({
    error: 'Internal server error',
    requestId,  // For support correlation
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message  // Detailed errors in development
    })
  });
}
```

**Error Context Preservation:**
```javascript
// ✅ Preserve error chain with additional context
class OperationError extends Error {
  constructor(message, originalError, context) {
    super(message);
    this.name = 'OperationError';
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

try {
  const result = await database.query(complexQuery);
  return processResult(result);
} catch (error) {
  throw new OperationError(
    'Database operation failed during processing',
    error,
    { 
      query: complexQuery.name,
      operation: 'data-processing',
      userId: req.user?.id
    }
  );
}
```

**Error Correlation System:**
```javascript
// ✅ Correlation IDs for cross-service error tracking
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || uuidv4();
  res.set('X-Correlation-ID', req.correlationId);
  next();
});

app.post('/api/upload', async (req, res) => {
  const { correlationId } = req;
  
  try {
    console.log('Upload started:', { correlationId, userId: req.user.id });
    
    await fileService.validate(req.file, { correlationId });
    await database.store(req.file, { correlationId });
    await notificationService.notify(req.user, { correlationId });
    
    console.log('Upload completed:', { correlationId });
    res.json({ success: true, correlationId });
  } catch (error) {
    console.error('Upload failed:', {
      correlationId,
      error: error.message,
      stack: error.stack,
      operation: error.context?.operation || 'unknown'
    });
    
    res.status(500).json({
      error: 'Upload failed',
      correlationId
    });
  }
});
```

## Error Cascade Masking

### Problem Description
Root causes become hidden when errors cascade through multiple layers without preserving original context.

### Common Scenarios

**Database Error Masking:**
```javascript
// ❌ Database constraint error becomes generic "validation failed"
async function createUser(userData) {
  try {
    return await db.query(
      'INSERT INTO users (email, username) VALUES ($1, $2)',
      [userData.email, userData.username]
    );
  } catch (error) {
    // Database error: duplicate key value violates unique constraint "users_email_key"
    throw new Error('User validation failed');  // Original cause lost
  }
}
```

**Network Error Masking:**
```javascript
// ❌ Network timeout becomes generic "service unavailable"
async function fetchUserProfile(userId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      timeout: 5000
    });
    return response.json();
  } catch (error) {
    // Original: TimeoutError: Request timed out after 5000ms
    throw new Error('Service unavailable');  // Specific cause masked
  }
}
```

**Validation Error Masking:**
```javascript
// ❌ Multiple validation failures become single generic error
async function validateUpload(file) {
  const errors = [];
  
  if (!file) errors.push('No file provided');
  if (file.size > MAX_SIZE) errors.push('File too large');
  if (!ALLOWED_TYPES.includes(file.type)) errors.push('Invalid file type');
  
  if (errors.length > 0) {
    throw new Error('File validation failed');  // Specific issues lost
  }
}
```

### Solutions

**Preserve Error Hierarchy:**
```javascript
// ✅ Maintain error chain with specific information
class DatabaseError extends Error {
  constructor(message, query, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.query = query;
    this.originalError = originalError;
    this.constraint = this.extractConstraint(originalError);
  }
  
  extractConstraint(error) {
    const match = error.message.match(/constraint "([^"]+)"/);
    return match ? match[1] : null;
  }
}

async function createUser(userData) {
  const query = 'INSERT INTO users (email, username) VALUES ($1, $2)';
  try {
    return await db.query(query, [userData.email, userData.username]);
  } catch (error) {
    throw new DatabaseError(
      'Failed to create user due to database constraint',
      query,
      error
    );
  }
}

// Handler can provide specific error messages
app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.constraint === 'users_email_key') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    console.error('User creation failed:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});
```

**Structured Error Aggregation:**
```javascript
// ✅ Collect and preserve all validation details
class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
    this.isValidationError = true;
  }
}

async function validateUpload(file) {
  const errors = [];
  
  if (!file) {
    errors.push({ 
      field: 'file', 
      code: 'REQUIRED', 
      message: 'No file provided' 
    });
  } else {
    if (file.size > MAX_SIZE) {
      errors.push({ 
        field: 'file.size', 
        code: 'TOO_LARGE', 
        message: `File size ${file.size} exceeds maximum ${MAX_SIZE}`,
        actual: file.size,
        maximum: MAX_SIZE
      });
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push({ 
        field: 'file.type', 
        code: 'INVALID_TYPE', 
        message: `File type ${file.type} not allowed`,
        actual: file.type,
        allowed: ALLOWED_TYPES
      });
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

// Handler provides detailed validation feedback
app.post('/upload', async (req, res) => {
  try {
    await validateUpload(req.file);
    // Process upload...
  } catch (error) {
    if (error.isValidationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Upload validation error:', error);
    res.status(500).json({ error: 'Upload processing failed' });
  }
});
```

## Observability Failures

### Problem Description
Lack of structured logging and monitoring makes it impossible to understand system behavior or diagnose issues effectively.

### Common Issues

**Insufficient Logging:**
```javascript
// ❌ No visibility into what's happening
app.post('/api/process', async (req, res) => {
  const result = await processData(req.body);
  res.json(result);
  // No logging of inputs, outputs, or timing
});
```

**Unstructured Logging:**
```javascript
// ❌ Hard to parse and analyze
console.log('User login attempt');
console.log('Processing data for user: ' + userId);
console.log('Error occurred: ' + error.message);
```

**No Performance Monitoring:**
```javascript
// ❌ No insight into performance characteristics
async function expensiveOperation() {
  const result = await database.complexQuery();
  return processResult(result);
  // No timing information or performance metrics
}
```

### Solutions

**Structured Logging:**
```javascript
// ✅ Consistent, parseable log format
const logger = {
  info: (message, metadata = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  },
  
  error: (message, error, metadata = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...metadata
    }));
  }
};

app.post('/api/process', async (req, res) => {
  const startTime = Date.now();
  const { correlationId } = req;
  
  logger.info('Processing request started', {
    correlationId,
    endpoint: '/api/process',
    userId: req.user?.id,
    inputSize: JSON.stringify(req.body).length
  });
  
  try {
    const result = await processData(req.body);
    
    logger.info('Processing request completed', {
      correlationId,
      duration: Date.now() - startTime,
      resultSize: JSON.stringify(result).length
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Processing request failed', error, {
      correlationId,
      duration: Date.now() - startTime,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      error: 'Processing failed', 
      correlationId 
    });
  }
});
```

**Performance Monitoring:**
```javascript
// ✅ Comprehensive performance tracking
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  startTimer(operation, metadata = {}) {
    const timerId = `${operation}-${Date.now()}-${Math.random()}`;
    this.metrics.set(timerId, {
      operation,
      startTime: process.hrtime.bigint(),
      metadata
    });
    return timerId;
  }
  
  endTimer(timerId) {
    const metric = this.metrics.get(timerId);
    if (!metric) return;
    
    const duration = Number(process.hrtime.bigint() - metric.startTime) / 1e6; // ms
    this.metrics.delete(timerId);
    
    logger.info('Performance metric', {
      operation: metric.operation,
      duration,
      ...metric.metadata
    });
    
    return duration;
  }
}

const monitor = new PerformanceMonitor();

async function expensiveOperation(userId, data) {
  const timerId = monitor.startTimer('expensiveOperation', { userId });
  
  try {
    const dbTimer = monitor.startTimer('database.complexQuery', { userId });
    const result = await database.complexQuery();
    monitor.endTimer(dbTimer);
    
    const processTimer = monitor.startTimer('processResult', { 
      userId, 
      resultSize: result.length 
    });
    const processed = processResult(result);
    monitor.endTimer(processTimer);
    
    return processed;
  } finally {
    monitor.endTimer(timerId);
  }
}
```

**Health Check Integration:**
```javascript
// ✅ Proactive system health monitoring
class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.status = { healthy: true, checks: {} };
  }
  
  addCheck(name, checkFunction, interval = 30000) {
    this.checks.set(name, { checkFunction, interval });
    this.scheduleCheck(name);
  }
  
  async scheduleCheck(name) {
    const { checkFunction, interval } = this.checks.get(name);
    
    try {
      const result = await checkFunction();
      this.status.checks[name] = {
        healthy: true,
        lastCheck: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      this.status.checks[name] = {
        healthy: false,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
      
      logger.error(`Health check failed: ${name}`, error);
    }
    
    this.updateOverallStatus();
    setTimeout(() => this.scheduleCheck(name), interval);
  }
  
  updateOverallStatus() {
    this.status.healthy = Object.values(this.status.checks)
      .every(check => check.healthy);
  }
}

const health = new HealthMonitor();

health.addCheck('database', async () => {
  const start = Date.now();
  await db.query('SELECT 1');
  return { responseTime: Date.now() - start };
});

health.addCheck('external-api', async () => {
  const start = Date.now();
  const response = await fetch(`${API_BASE}/health`);
  return { 
    status: response.status,
    responseTime: Date.now() - start
  };
});

app.get('/health', (req, res) => {
  const httpStatus = health.status.healthy ? 200 : 503;
  res.status(httpStatus).json(health.status);
});
```

## Error Recovery Strategies

### Graceful Degradation

**Service Fallbacks:**
```javascript
// ✅ Graceful handling when external services fail
async function getUserProfile(userId) {
  try {
    // Primary data source
    return await externalAPI.getProfile(userId);
  } catch (error) {
    logger.warn('External API unavailable, using cached data', {
      userId,
      error: error.message
    });
    
    try {
      // Fallback to cache
      return await cache.getProfile(userId);
    } catch (cacheError) {
      logger.warn('Cache also unavailable, using minimal profile', {
        userId,
        cacheError: cacheError.message
      });
      
      // Final fallback
      return { id: userId, name: 'User', email: null };
    }
  }
}
```

**Circuit Breaker Pattern:**
```javascript
// ✅ Prevent cascade failures with circuit breaker
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

const apiCircuitBreaker = new CircuitBreaker();

async function callExternalAPI(data) {
  try {
    return await apiCircuitBreaker.execute(async () => {
      return await fetch(`${API_BASE}/process`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    });
  } catch (error) {
    logger.warn('External API call failed', { 
      error: error.message,
      circuitState: apiCircuitBreaker.state
    });
    
    // Return cached result or default response
    return getDefaultResponse(data);
  }
}
```

## Best Practices Summary

1. **Preserve Error Context:** Maintain original error information through handling chain
2. **Use Structured Logging:** JSON format for machine-readable logs
3. **Implement Correlation IDs:** Track errors across service boundaries
4. **Monitor Performance:** Track timing and resource usage
5. **Plan for Failures:** Implement graceful degradation and fallbacks
6. **Provide Actionable Errors:** Include enough detail for effective debugging
7. **Separate Development/Production:** Detailed errors in dev, safe messages in prod