const http = require('http');

const data = JSON.stringify({
    username: 'proftvv',
    password: 'proftvv'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`ERROR CODE: ${e.code}`);
    console.error(`ERROR MSG: ${e.message}`);
});

req.write(data);
req.end();
