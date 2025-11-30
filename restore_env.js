
const fs = require('fs');
const content = `DISCORD_WEBHOOK_URL="YOUR_WEBHOOK_URL"
DISCORD_CLIENT_ID="YOUR_CLIENT_ID"
DISCORD_CLIENT_SECRET="YOUR_CLIENT_SECRET"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"
CRON_SECRET="your-cron-secret-key"
`;

fs.writeFileSync('.env', content);
console.log(".env file restored successfully.");
