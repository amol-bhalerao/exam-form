#!/usr/bin/env node
const { Client } = require('ssh2');

const config = {
    host: '45.130.228.77',
    port: 65002,
    username: 'u441114691',
    password: 'Aarya@20211234567890',
    readyTimeout: 30000
};

const conn = new Client();

function execCommand(command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.on('close', code => resolve({ code, output: out }));
        });
    });
}

async function discover() {
    try {
        console.log('Discovering Hostinger directory structure...\n');

        console.log('Home directory:');
        let res = await execCommand('pwd && ls -la ~');
        console.log(res.output);

        console.log('\nChecking domains folder:');
        res = await execCommand('ls -la ~/domains/ 2>/dev/null || echo "No domains folder"');
        console.log(res.output);

        console.log('\nChecking public_html:');
        res = await execCommand('ls -la ~/public_html/ 2>/dev/null || echo "No public_html"');
        console.log(res.output);

        console.log('\nSearching for nodejs directories:');
        res = await execCommand('find ~ -type d -name "nodejs" 2>/dev/null | head -10');
        console.log(res.output);

        console.log('\nSearching for node_modules (might indicate projects):');
        res = await execCommand('find ~ -type d -name "node_modules" -prune -o -type d -name "server*" -o -type d -name "backend*" 2>/dev/null | head');
        console.log(res.output);

        console.log('\nAll directories in home:');
        res = await execCommand('ls -1d ~/* 2>/dev/null');
        console.log(res.output);

        conn.end();
    } catch (err) {
        console.error('Error:', err.message);
        conn.end();
    }
}

conn.on('ready', discover);
conn.on('error', err => console.error('Connection error:', err.message));

console.log('Connecting to Hostinger...\n');
conn.connect(config);
