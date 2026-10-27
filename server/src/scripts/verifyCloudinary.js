const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { verifyCloudinaryConfig, isCloudinaryConfigured } = require('../config/cloudinary');

async function run() {
  console.log('=== LifeLedger Cloudinary Configuration Diagnostic ===\n');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  console.log('1. Environment Variables Presence:');
  console.log(`   - CLOUDINARY_CLOUD_NAME : ${cloudName ? `Present (${cloudName.length} chars, '${cloudName.slice(0, 3)}...')` : 'MISSING'}`);
  console.log(`   - CLOUDINARY_API_KEY    : ${apiKey ? `Present (${apiKey.length} chars, '${apiKey.slice(0, 3)}...')` : 'MISSING'}`);
  console.log(`   - CLOUDINARY_API_SECRET : ${apiSecret ? `Present (${apiSecret.length} chars, hidden)` : 'MISSING'}`);

  if (!isCloudinaryConfigured()) {
    console.error('\n❌ Cloudinary is NOT fully configured. One or more required environment variables are missing in server/.env.');
    process.exit(1);
  }

  console.log('\n2. Testing Cloudinary API Connectivity & Credentials:');
  const result = await verifyCloudinaryConfig();

  if (result.valid) {
    console.log('   ✅ Cloudinary API verified successfully! Status:', result.status);
    console.log('   Storage is ready for authenticated uploads.\n');
    process.exit(0);
  } else {
    console.error('   ❌ Cloudinary API verification failed:');
    console.error(`      ${result.error || result.message}`);
    console.log('\nSuggested Resolution:');
    console.log('   1. Log in to your Cloudinary Console (https://console.cloudinary.com).');
    console.log('   2. Verify that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET all belong to the same Cloudinary account.');
    console.log('   3. Copy the exact API Secret from the Cloudinary dashboard into server/.env without extra spaces.');
    console.log('   4. Re-run this check.\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Unexpected diagnostic error:', err.message);
  process.exit(1);
});
