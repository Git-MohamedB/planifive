
const fs = require('fs');
try {
    const content = fs.readFileSync('.env', 'utf8');
    console.log("Keys in .env:");
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=/);
        if (match) console.log(match[1]);
    });
} catch (e) {
    console.log("Error reading .env:", e.message);
}
