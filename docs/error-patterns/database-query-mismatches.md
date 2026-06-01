# Database Query Mismatches

Detailed documentation for INSERT/RETURNING column mismatches and schema evolution issues.

## Column Mismatch Errors

### Problem Description
Database queries fail when INSERT statements don't provide values for all columns expected by RETURNING clauses, or when column counts don't match between different parts of the query.

### Common Error Messages
```sql
-- MySQL
ERROR 1136: Column count doesn't match value count at row 1

-- PostgreSQL  
ERROR: INSERT has more expressions than target columns

-- SQL Server
Column name or number of supplied values does not match table definition
```

### Root Causes

**Missing RETURNING Columns in INSERT:**
```sql
-- ❌ Problem: INSERT missing columns that RETURNING expects
INSERT INTO overlay_assets (original_name, storage_path, file_size)
VALUES ('image.jpg', '/path/to/image.jpg', 1024)
RETURNING id, original_name, storage_path, blend_mode, opacity;
-- ERROR: blend_mode and opacity not provided in INSERT
```

**Implicit Column Ordering:**
```sql
-- ❌ Problem: Relying on column order without specification
INSERT INTO users VALUES ('john', 'john@email.com', 'password');
-- Breaks when new columns are added to table
```

**Schema Evolution Lag:**
```sql
-- ❌ Problem: Application query not updated after schema change
INSERT INTO products (name, price) VALUES ('widget', 19.99)
RETURNING id, name, price, category_id;
-- ERROR: category_id column added to table but not in INSERT
```

### Solutions

**Explicit Column Specification:**
```sql
-- ✅ Always specify columns explicitly
INSERT INTO overlay_assets (
  original_name,
  storage_path, 
  file_size,
  content_type,
  security_hash,
  jpeg_path,
  blend_mode,
  opacity,
  active
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, original_name, jpeg_path, blend_mode, opacity, active;
```

**Default Value Handling:**
```sql
-- ✅ Solution: Provide explicit defaults or use database defaults
INSERT INTO overlay_assets (
  original_name,
  storage_path,
  file_size,
  blend_mode,    -- explicit default
  opacity,       -- explicit default
  active         -- explicit default
) VALUES (
  'image.jpg',
  '/path/image.jpg', 
  1024,
  'overlay',     -- default blend mode
  0.8,           -- default opacity
  false          -- default active state
)
```

**Schema-Aware Queries:**
```sql
-- ✅ Query current schema before building INSERT
SELECT column_name, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'overlay_assets'
ORDER BY ordinal_position;
```

## Schema Evolution Drift

### Problem Description
Applications continue using outdated query patterns after database schema changes, leading to constraint violations, data inconsistencies, and **Referential Integrity** violations when foreign key relationships break.

### Common Scenarios

**Added Required Columns:**
```sql
-- Schema change: Add required column
ALTER TABLE users ADD COLUMN tenant_id UUID NOT NULL;

-- ❌ Old application code still works but violates constraint
INSERT INTO users (name, email) VALUES ('john', 'john@email.com');
-- ERROR: Column 'tenant_id' cannot be null
```

**Column Renames:**
```sql
-- Schema change: Rename column for clarity
ALTER TABLE products RENAME COLUMN desc TO description;

-- ❌ Application still uses old column name
SELECT id, name, desc FROM products;  
-- ERROR: Unknown column 'desc' in field list
```

**Type Changes:**
```sql
-- Schema change: Change column type
ALTER TABLE orders ALTER COLUMN total TYPE DECIMAL(10,2);

-- ❌ Application sends string instead of decimal
INSERT INTO orders (customer_id, total) VALUES (123, '19.99');
-- May cause type conversion errors or data loss
```

### Prevention Strategies

**Migration-Application Coupling:**
```sql
-- 1. Add column with default
ALTER TABLE users ADD COLUMN tenant_id UUID DEFAULT gen_random_uuid();

-- 2. Update application to provide explicit values
-- 3. Remove default once application updated
ALTER TABLE users ALTER COLUMN tenant_id DROP DEFAULT;
```

**Backwards Compatible Changes:**
```sql
-- Safe column addition
ALTER TABLE users ADD COLUMN tenant_id UUID NULL;
-- Update application code gradually
-- Add NOT NULL constraint later

-- Safe column rename
ALTER TABLE products ADD COLUMN description TEXT;
UPDATE products SET description = desc;
-- Update application to use new column
-- Drop old column once migration complete
ALTER TABLE products DROP COLUMN desc;
```

**Schema Validation in Application:**
```javascript
// Validate expected columns exist before query
const validateSchema = async (tableName, expectedColumns) => {
  const result = await db.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
  `, [tableName]);
  
  const actualColumns = result.rows.map(row => row.column_name);
  const missing = expectedColumns.filter(col => !actualColumns.includes(col));
  
  if (missing.length > 0) {
    throw new Error(`Missing columns in ${tableName}: ${missing.join(', ')}`);
  }
};
```

## Query Construction Anti-Patterns

### Problem Description
Common patterns in query construction that lead to maintenance issues and runtime failures.

### Anti-Pattern 1: String Concatenation

**Problem:**
```javascript
// ❌ Vulnerable to SQL injection and maintenance issues
const query = `
  INSERT INTO users (name, email, created_at) 
  VALUES ('${name}', '${email}', '${new Date().toISOString()}')
  RETURNING id, name, email
`;
```

**Solution:**
```javascript
// ✅ Use parameterized queries
const query = `
  INSERT INTO users (name, email, created_at)
  VALUES ($1, $2, $3)
  RETURNING id, name, email
`;
const result = await db.query(query, [name, email, new Date()]);
```

### Anti-Pattern 2: Dynamic Column Lists

**Problem:**
```javascript
// ❌ Column lists change based on runtime conditions
const columns = [];
const values = [];
if (name) { columns.push('name'); values.push(name); }
if (email) { columns.push('email'); values.push(email); }

const query = `
  INSERT INTO users (${columns.join(', ')})
  VALUES (${values.map((_, i) => `$${i+1}`).join(', ')})
  RETURNING id, name, email  -- May return NULL for missing columns
`;
```

**Solution:**
```javascript
// ✅ Explicit column handling with defaults
const query = `
  INSERT INTO users (name, email, created_at)
  VALUES ($1, $2, $3)
  RETURNING id, name, email
`;
const result = await db.query(query, [
  name || null,
  email || null, 
  new Date()
]);
```

### Anti-Pattern 3: Assumed Column Order

**Problem:**
```javascript
// ❌ Assumes specific column order in RETURNING
const query = `
  INSERT INTO users (name, email) VALUES ($1, $2)
  RETURNING *  -- Order depends on table definition
`;
const [id, name, email, createdAt] = result.rows[0];  // Fragile
```

**Solution:**
```javascript
// ✅ Explicit column specification and access
const query = `
  INSERT INTO users (name, email) VALUES ($1, $2)
  RETURNING id, name, email, created_at
`;
const user = result.rows[0];
const { id, name, email, created_at } = user;  // Robust
```

## Database-Specific Considerations

### PostgreSQL

**RETURNING Clause Features:**
```sql
-- Multiple row operations
INSERT INTO users (name, email) 
VALUES ('john', 'john@email.com'), ('jane', 'jane@email.com')
RETURNING id, name;

-- Expressions in RETURNING
INSERT INTO orders (customer_id, amount)
VALUES (123, 99.99)
RETURNING id, amount, amount * 0.08 AS tax;

-- UPDATE and DELETE with RETURNING
UPDATE products SET price = price * 1.1 
WHERE category = 'electronics'
RETURNING id, name, price;
```

**Generated Columns:**
```sql
-- Computed columns automatically included
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax) STORED
);

INSERT INTO orders (subtotal, tax) VALUES (100.00, 8.00)
RETURNING id, subtotal, tax, total;  -- total computed automatically
```

### MySQL

**Limitations and Workarounds:**
```sql
-- MySQL doesn't support RETURNING in INSERT
-- Use LAST_INSERT_ID() instead
INSERT INTO users (name, email) VALUES ('john', 'john@email.com');
SELECT LAST_INSERT_ID() AS id, 'john' AS name, 'john@email.com' AS email;

-- Or use stored procedure for complex logic
DELIMITER //
CREATE PROCEDURE InsertUser(IN p_name VARCHAR(100), IN p_email VARCHAR(100))
BEGIN
  INSERT INTO users (name, email) VALUES (p_name, p_email);
  SELECT LAST_INSERT_ID() AS id, p_name AS name, p_email AS email;
END //
DELIMITER ;
```

### SQL Server

**OUTPUT Clause:**
```sql
-- SQL Server uses OUTPUT instead of RETURNING
INSERT INTO users (name, email)
OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
VALUES ('john', 'john@email.com');

-- OUTPUT with computed values
INSERT INTO orders (customer_id, subtotal, tax_rate)
OUTPUT INSERTED.id, INSERTED.subtotal, 
       INSERTED.subtotal * INSERTED.tax_rate AS tax
VALUES (123, 100.00, 0.08);
```

## Testing Strategies

### Schema Change Testing

**Migration Testing:**
```javascript
describe('Schema Migration Tests', () => {
  test('INSERT works with new schema', async () => {
    // Test that application queries work after migration
    const result = await db.query(`
      INSERT INTO overlay_assets (
        original_name, storage_path, file_size,
        blend_mode, opacity, active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, original_name, blend_mode, opacity
    `, ['test.jpg', '/path/test.jpg', 1024, 'overlay', 0.8, false]);
    
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0]).toHaveProperty('blend_mode', 'overlay');
    expect(result.rows[0]).toHaveProperty('opacity', 0.8);
  });
});
```

**Query Validation Testing:**
```javascript
describe('Query Construction Tests', () => {
  test('INSERT columns match RETURNING expectations', async () => {
    const insertColumns = [
      'original_name', 'storage_path', 'file_size',
      'blend_mode', 'opacity', 'active'
    ];
    const returningColumns = ['id', 'original_name', 'blend_mode', 'opacity'];
    
    // Verify all RETURNING columns have corresponding INSERT values
    const nonIdColumns = returningColumns.filter(col => col !== 'id');
    nonIdColumns.forEach(col => {
      expect(insertColumns).toContain(col);
    });
  });
});
```

### Integration Testing

**Database Schema Validation:**
```javascript
describe('Database Schema Integration', () => {
  test('application schema matches database schema', async () => {
    const expectedColumns = [
      'id', 'original_name', 'storage_path', 'file_size',
      'content_type', 'security_hash', 'jpeg_path',
      'blend_mode', 'opacity', 'active', 'created_at'
    ];
    
    const result = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'overlay_assets'
      ORDER BY ordinal_position
    `);
    
    const actualColumns = result.rows.map(row => row.column_name);
    expect(actualColumns).toEqual(expectedColumns);
  });
});
```

## Best Practices Summary

1. **Always Specify Columns:** Never rely on implicit column ordering
2. **Align INSERT and RETURNING:** Ensure all returned columns have values
3. **Use Parameterized Queries:** Prevent SQL injection and improve maintainability  
4. **Validate Schema Changes:** Test application queries against new schema
5. **Implement Graceful Defaults:** Handle missing values explicitly
6. **Version Control Migrations:** Track schema changes with application updates
7. **Test Schema Integration:** Validate application assumptions about database structure