import fs from 'fs';
import path from 'path';
import globPkg from 'glob';
const { glob } = globPkg;

class ProductionSafetyChecker {
  constructor() {
    this.violations = [];
    this.checkedFiles = 0;
    this.patterns = [
      {
        regex: /host:\s*['"`]localhost['"`]/g,
        message: 'Hardcoded localhost host in database config',
        suggestion: 'Use process.env.DATABASE_HOST || \'localhost\'',
        severity: 'error'
      },
      {
        regex: /['"`]postgresql:\/\/[^'"`]*localhost[^'"`]*['"`]/g,
        message: 'Hardcoded localhost in PostgreSQL connection string',
        suggestion: 'Use process.env.DATABASE_URL',
        severity: 'error'
      },
      {
        regex: /['"`]localhost:\d+['"`]/g,
        message: 'Hardcoded localhost port connection',
        suggestion: 'Use environment variable with fallback',
        severity: 'error'
      },
      {
        regex: /fetch\(\s*['"`]http:\/\/localhost:\d+[^'"`]*['"`]/g,
        message: 'Hardcoded localhost URL in fetch call',
        suggestion: 'Use process.env.API_BASE_URL with path concatenation',
        severity: 'error'
      },
      {
        regex: /['"`]127\.0\.0\.1:\d+['"`]/g,
        message: 'Hardcoded 127.0.0.1 IP address',
        suggestion: 'Use environment variable',
        severity: 'warning'
      }
    ];
  }

  isFileAllowed(filePath) {
    const allowedPatterns = [
      /.*\.test\.(ts|js|mjs)$/,
      /.*\.spec\.(ts|js|mjs)$/,
      /.*\.local\.(ts|js|mjs)$/,
      /dev-tools\/.*\.(ts|js|mjs)$/,
      /examples\/.*\.(ts|js|mjs)$/,
      /node_modules\//,
      /\.git\//,
      /dist\//,
      /build\//
    ];

    return allowedPatterns.some(pattern => pattern.test(filePath));
  }

  isCriticalFile(filePath) {
    const criticalPatterns = [
      /scripts\/.*\.(ts|js|mjs)$/,
      /src\/lib\/.*\.(ts|js)$/,
      /src\/pages\/api\/.*\.(ts|js)$/,
      /src\/components\/.*\.(ts|js)$/
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  checkFile(filePath) {
    if (this.isFileAllowed(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = this.detectLocalhostPatterns(content, filePath);

    if (violations.length > 0) {
      this.violations.push({
        file: filePath,
        violations,
        isCritical: this.isCriticalFile(filePath)
      });
    }

    this.checkedFiles++;
  }

  detectLocalhostPatterns(content, filePath) {
    const lines = content.split('\n');
    const violations = [];

    this.patterns.forEach(pattern => {
      pattern.regex.lastIndex = 0; // Reset regex state
      let match;

      while ((match = pattern.regex.exec(content)) !== null) {
        const position = this.getPosition(content, match.index);

        violations.push({
          line: position.line,
          column: position.column,
          pattern: match[0],
          message: pattern.message,
          suggestion: pattern.suggestion,
          severity: pattern.severity,
          context: this.getContextLines(lines, position.line - 1)
        });
      }
    });

    return violations;
  }

  getPosition(content, index) {
    const beforeMatch = content.substring(0, index);
    const lines = beforeMatch.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  getContextLines(lines, lineIndex) {
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(lines.length, lineIndex + 3);

    return lines.slice(start, end).map((line, i) => ({
      number: start + i + 1,
      content: line,
      isMatch: start + i === lineIndex
    }));
  }

  scanFiles() {
    const patterns = [
      'scripts/**/*.{ts,js,mjs}',
      'src/**/*.{ts,js}',
      '*.{ts,js,mjs}'
    ];

    patterns.forEach(pattern => {
      const files = glob.sync(pattern, {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
      });

      files.forEach(file => {
        try {
          this.checkFile(file);
        } catch (error) {
          console.warn(`Warning: Could not check file ${file}: ${error.message}`);
        }
      });
    });
  }

  generateReport() {
    console.log(`🔍 Production Safety Check Report`);
    console.log(`Files checked: ${this.checkedFiles}`);
    console.log('');

    if (this.violations.length === 0) {
      console.log(`✅ No production safety violations found!`);
      return true;
    }

    const criticalViolations = this.violations.filter(v => v.isCritical);
    const warningViolations = this.violations.filter(v => !v.isCritical);

    if (criticalViolations.length > 0) {
      console.log(`❌ ${criticalViolations.length} critical violation(s) found:\n`);

      criticalViolations.forEach(({ file, violations }) => {
        console.log(`📄 ${file}:`);
        violations.forEach(v => {
          console.log(`  ${v.severity.toUpperCase()} Line ${v.line}:${v.column} - ${v.message}`);
          console.log(`    Pattern: ${v.pattern}`);
          console.log(`    💡 Suggestion: ${v.suggestion}`);

          if (v.context) {
            console.log(`    Context:`);
            v.context.forEach(ctx => {
              const marker = ctx.isMatch ? '  >' : '   ';
              console.log(`${marker} ${ctx.number.toString().padStart(3)}: ${ctx.content}`);
            });
          }

          console.log('');
        });
      });
    }

    if (warningViolations.length > 0) {
      console.log(`⚠️  ${warningViolations.length} warning(s) found:\n`);

      warningViolations.forEach(({ file, violations }) => {
        console.log(`📄 ${file}:`);
        violations.forEach(v => {
          console.log(`  WARNING Line ${v.line}:${v.column} - ${v.message}`);
          console.log(`    Pattern: ${v.pattern}`);
          console.log(`    💡 Suggestion: ${v.suggestion}\n`);
        });
      });
    }

    const hasErrors = criticalViolations.length > 0;

    if (hasErrors) {
      console.log('❌ Production safety check failed due to critical violations.');
      console.log('🔧 Fix these issues before deploying to production.\n');
    } else {
      console.log('⚠️  Production safety check passed with warnings.');
      console.log('💡 Consider addressing warnings for better production safety.\n');
    }

    return !hasErrors;
  }
}

function main() {
  console.log('🚀 Running production safety check...\n');

  const checker = new ProductionSafetyChecker();
  checker.scanFiles();

  const success = checker.generateReport();

  process.exit(success ? 0 : 1);
}

main();

export { ProductionSafetyChecker };