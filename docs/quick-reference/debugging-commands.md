# Debugging Commands Quick Reference

Essential commands for diagnosing multi-layer backend issues.

## TypeScript & Module Resolution

### Compilation Diagnostics
```bash
# Basic compilation check
npx tsc --noEmit

# Detailed compilation with timing
npx tsc --noEmit --extendedDiagnostics

# Show final configuration
npx tsc --showConfig

# Check specific file compilation
npx tsc --noEmit path/to/file.ts
```

### Module Resolution Tracing
```bash
# Trace resolution for specific module
npx tsc --traceResolution | grep "module-name"

# Show all resolution attempts
npx tsc --traceResolution > resolution.log

# Test Node.js module resolution
node -e "console.log(require.resolve('./path/to/module'))"

# Test ES module resolution
node -e "import('./path/to/module.js').then(console.log)"
```

### Import Analysis
```bash
# Find all TypeScript imports
grep -r "import.*from" src/ --include="*.ts" --include="*.tsx"

# Find imports with extensions
grep -r "from.*\.[jt]sx\?['\"]" src/

# Find relative imports
grep -r "from ['\"]\\." src/ --include="*.ts"

# Check for mixed import styles
grep -r "require(" src/ --include="*.ts"
```

## Database Operations

### Schema Inspection
```bash
# PostgreSQL table structure
psql -d database_name -c "\\d table_name"

# MySQL table structure  
mysql -D database_name -e "DESCRIBE table_name;"

# Get column details with constraints
psql -d database_name -c "
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'table_name'
  ORDER BY ordinal_position;
"
```

### Query Testing
```bash
# Test INSERT query
psql -d database_name -c "
  INSERT INTO table_name (col1, col2) 
  VALUES ('test1', 'test2')
  RETURNING *;
"

# Test column alignment
psql -d database_name -c "
  SELECT 'INSERT' as operation, 'col1,col2,col3' as columns
  UNION ALL
  SELECT 'RETURNING' as operation, 'id,col1,col2,col3' as columns;
"

# Check for schema drift
psql -d database_name -c "
  SELECT table_name, column_name, ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
"
```

### Migration Status
```bash
# Check migration status (common tools)
npm run db:migration:status
npx knex migrate:status
npx sequelize-cli db:migrate:status
npx prisma migrate status

# Show migration history
git log --oneline -- migrations/
git log --oneline --grep="migration"
```

## File System & Build Tools

### File Existence & Structure
```bash
# Find files by pattern
find . -name "*.ts" -type f | grep "module-name"
find . -path "*/node_modules" -prune -o -name "*.ts" -type f -print

# Check build output
ls -la dist/
ls -la build/

# Find missing files
find src/ -name "*.ts" -exec basename {} .ts \; | sort > source-files.txt
find dist/ -name "*.js" -exec basename {} .js \; | sort > build-files.txt
diff source-files.txt build-files.txt
```

### Build Tool Diagnostics
```bash
# Vite build analysis
npx vite build --debug

# Webpack bundle analysis
npx webpack-bundle-analyzer dist/

# Next.js build info
npx next build --debug

# Check bundler configuration
cat vite.config.ts webpack.config.js next.config.js
```

## Error Analysis

### Log Analysis
```bash
# Find recent errors in logs
tail -f logs/error.log | grep -i error

# Count error types
grep -o "Error: [^\"]*" logs/error.log | sort | uniq -c | sort -nr

# Find specific error patterns
grep -r "Internal server error" logs/
grep -r "500" logs/ | head -20

# Extract error context
grep -A 5 -B 5 "specific-error-message" logs/error.log
```

### Network & Service Diagnostics
```bash
# Test API endpoints
curl -X GET http://localhost:3000/health -v
curl -X POST http://localhost:3000/api/test -d '{}' -H "Content-Type: application/json" -v

# Check service status
systemctl status your-service
docker ps | grep your-app
pm2 status

# Network connectivity
telnet localhost 5432  # Database
telnet localhost 6379  # Redis
curl -I http://external-api.com/health
```

## Application Debugging

### Runtime Diagnostics
```bash
# Node.js memory usage
node -e "console.log(process.memoryUsage())"

# Check environment variables
printenv | grep NODE
echo $NODE_ENV $DATABASE_URL

# Test module loading
node -e "try { require('./dist/app.js'); console.log('✅ Module loads'); } catch(e) { console.error('❌', e.message); }"
```

### Performance Analysis
```bash
# CPU profiling
node --prof your-app.js

# Memory heap snapshot
node --inspect your-app.js
# Then use Chrome DevTools

# Event loop lag monitoring
node -e "
  setInterval(() => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start;
      console.log('Event loop lag:', Number(delta) / 1e6, 'ms');
    });
  }, 1000);
"
```

## Integration Testing Commands

### End-to-End Workflow Testing
```bash
# Test complete TypeScript to runtime pipeline
npm run build && node dist/app.js --test-mode

# Test database connection and queries
npm run db:test-connection
npm run test:database

# Test API endpoints with real requests
npm run test:integration
npm run test:e2e
```

### Multi-Layer Validation
```bash
# Validate all layers in sequence
echo "Testing TypeScript..." && npx tsc --noEmit \
  && echo "Testing Database..." && npm run db:health-check \
  && echo "Testing Integration..." && npm run test:integration \
  && echo "✅ All layers healthy"

# Check for configuration drift
git diff HEAD~1 tsconfig.json package.json
npm ls --depth=0 | grep -E "(typescript|@types)"
```

## Emergency Debugging Workflow

### Quick Health Check
```bash
#!/bin/bash
echo "🩺 Quick Health Check"

echo "1. TypeScript compilation:"
npx tsc --noEmit && echo "✅" || echo "❌"

echo "2. Database connectivity:"
npm run db:ping && echo "✅" || echo "❌"

echo "3. Service startup:"
timeout 10s npm start > /dev/null 2>&1 && echo "✅" || echo "❌"

echo "4. Basic API response:"
curl -f http://localhost:3000/health > /dev/null 2>&1 && echo "✅" || echo "❌"
```

### Layer Isolation Testing
```bash
#!/bin/bash
# Test each layer independently

echo "🔍 Layer Isolation Testing"

# Layer 1: TypeScript
echo "TypeScript Layer:"
npx tsc --noEmit --skipLibCheck
echo "Status: $?"

# Layer 2: Database  
echo "Database Layer:"
psql -c "SELECT 1" > /dev/null 2>&1
echo "Status: $?"

# Layer 3: Module Resolution
echo "Module Resolution Layer:"
node -e "require('./dist/main.js')" > /dev/null 2>&1
echo "Status: $?"

# Layer 4: Integration
echo "Integration Layer:"
npm run test:integration > /dev/null 2>&1
echo "Status: $?"
```

### Root Cause Analysis
```bash
# Trace error through layers
echo "🔍 Root Cause Analysis"

# Check recent changes
echo "Recent changes:"
git log --oneline -10

# Check error timeline
echo "Error timeline:"
grep -h "\[ERROR\]" logs/*.log | tail -20 | cut -d' ' -f1-2

# Check configuration changes
echo "Configuration changes:"
git diff HEAD~5 -- "*.json" "*.config.*"

# Check dependency changes
echo "Dependency changes:"
git diff HEAD~5 -- package.json package-lock.json
```

## Tool-Specific Commands

### PostgreSQL
```bash
# Connection test
pg_isready -h localhost -p 5432

# Query analysis
psql -c "EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;"

# Lock analysis
psql -c "SELECT * FROM pg_locks WHERE granted = false;"
```

### MySQL
```bash
# Connection test
mysqladmin -h localhost -u user -p ping

# Process list
mysql -e "SHOW PROCESSLIST;"

# Query analysis
mysql -e "EXPLAIN SELECT * FROM table_name WHERE condition;"
```

### Redis
```bash
# Connection test
redis-cli ping

# Memory usage
redis-cli info memory

# Key analysis
redis-cli --scan --pattern "key-pattern*"
```

### Docker
```bash
# Container logs
docker logs container_name --tail 50 -f

# Container shell access
docker exec -it container_name /bin/bash

# Container resource usage
docker stats container_name
```

## Monitoring & Alerting

### System Metrics
```bash
# CPU and memory
top -n 1 | head -20
free -h
iostat -x 1 1

# Disk usage
df -h
du -sh /path/to/app/*

# Network connections
netstat -tuln | grep :3000
ss -tuln | grep :5432
```

### Application Metrics
```bash
# Process information
ps aux | grep node
pgrep -f "node.*app"

# File descriptors
lsof -p $(pgrep -f "node.*app") | wc -l

# Port usage
lsof -i :3000
fuser 3000/tcp
```

## Related Documentation

- [Backend Error Taxonomy](../backend-error-taxonomy.md) - Context for these commands
- [Debugging Workflows](../debugging-workflows.md) - Systematic approaches using these tools
- [Error Prevention Checklist](../error-prevention-checklist.md) - Proactive commands for prevention