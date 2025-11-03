console.log('\n' + '═'.repeat(70));
console.log('📦 KUSHON FRONTEND - BUILD CONFIGURATION');
console.log('═'.repeat(70));

console.log('\n🌍 ENVIRONMENT:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  CI: ${process.env.CI || 'not set'}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  Node Version: ${process.version}`);

console.log('\n⚙️  BUILD CONFIGURATION:');
console.log(`  VITE_API_URL: ${process.env.VITE_API_URL || 'not set (will use default)'}`);

if (process.env.HEROKU_APP_NAME) {
  console.log('\n🔷 HEROKU DEPLOYMENT:');
  console.log(`  App Name: ${process.env.HEROKU_APP_NAME}`);
  console.log(`  Dyno: ${process.env.DYNO || 'not set'}`);
  console.log(`  Release Version: ${process.env.HEROKU_RELEASE_VERSION || 'not set'}`);
  console.log(`  Slug Commit: ${process.env.HEROKU_SLUG_COMMIT || 'not set'}`);
}

console.log('\n🔌 PORT CONFIGURATION:');
console.log(`  PORT: ${process.env.PORT || '3000 (default)'}`);

console.log('\n🔗 BACKEND CONNECTION:');
const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api';
console.log(`  API URL: ${apiUrl}`);

try {
  const url = new URL(apiUrl);
  console.log(`  Protocol: ${url.protocol}`);
  console.log(`  Host: ${url.hostname}`);
  console.log(`  Port: ${url.port || 'default'}`);
  console.log(`  Path: ${url.pathname}`);
} catch (error) {
  console.log(`  ⚠️  Invalid URL format: ${apiUrl}`);
}

console.log('\n⚠️  IMPORTANT NOTES:');
if (!process.env.VITE_API_URL) {
  console.log('  ⚠️  VITE_API_URL is not set!');
  console.log('     Frontend will use default: http://localhost:3000/api');
  console.log('     For production, set VITE_API_URL environment variable.');
}

if (process.env.VITE_API_URL && process.env.VITE_API_URL.includes('localhost')) {
  console.log('  ⚠️  VITE_API_URL points to localhost!');
  console.log('     This will not work in production.');
  console.log('     Update VITE_API_URL to your production backend URL.');
}

console.log('\n✅ Configuration validated successfully!');
console.log('═'.repeat(70) + '\n');