const fs = require('fs');

try {
    const data = fs.readFileSync('package-lock.json', 'utf8');
    JSON.parse(data);
    console.log("VALID JSON");
} catch (e) {
    console.log("INVALID JSON", e.message);
}
