import { validateMigrations, formatValidationOutput } from './migration-validator.ts';

async function main() {
  console.log('🔍 Testing migration validation...\n');

  try {
    const result = await validateMigrations('./migrations');
    const output = formatValidationOutput(result);

    console.log('Validation Result:');
    console.log(output);

    if (!result.valid && result.missingRoles.includes('web_app')) {
      console.log('\n✅ Successfully detected the web_app role dependency issue!');
    } else {
      console.log('\n❌ Failed to detect the expected web_app role issue');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();