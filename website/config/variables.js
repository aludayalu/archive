export var API_URL = "https://server.archive.aaravdayal.com"

try {
    if (location.hostname !== "archive.aaravdayal.com") {
        API_URL = "http://10.140.1.214:4665"
    }
} catch {}