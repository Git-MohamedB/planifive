
const fs = require('fs');
try {
    const content = fs.readFileSync('.env', 'utf8');
    const match = content.match(/DISCORD_WEBHOOK_URL=(.*)/);
    if (match) {
        console.log("WEBHOOK_FOUND:" + match[1]);
    } else {
        console.log("WEBHOOK_NOT_FOUND");
    }
} catch (e) {
    console.log("Error:", e.message);
}
