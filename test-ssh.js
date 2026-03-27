#!/usr/bin/env node
/**
 * Test SSH connectivity to Hostinger
 */

const Client = require('ssh2').Client;
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askPassword(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function connect() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SSH Connection Test to Hostinger');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const conn = new Client();

  // Try key auth first
  console.log('Attempting key-based authentication...');

  const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'hostinger');
  if (!fs.existsSync(keyPath)) {
    console.error(`✗ SSH key not found at: ${keyPath}`);
    process.exit(1);
  }

  conn
    .on('ready', () => {
      console.log('✓ SSH connection successful!\n');

      conn.exec('whoami', (err, stream) => {
        if (err) {
          console.error('Error running command:', err);
          conn.end();
          process.exit(1);
        }

        let output = '';
        stream.on('close', (code, signal) => {
          console.log('Current user:', output.trim());
          conn.end();
          process.exit(0);
        });
        stream.on('data', (data) => {
          output += data;
        });
      });
    })
    .on('error', async (err) => {
      console.error('✗ Connection error:', err.message);

      //Try password auth
      console.log('\nAttempting password-based authentication...');
      const password = await askPassword('Enter SSH password: ');
      rl.close();

      const conn2 = new Client();
      conn2
        .on('ready', () => {
          console.log('✓ SSH connection successful with password!\n');
          conn2.end();
          process.exit(0);
        })
        .on('error', (err) => {
          console.error('✗ Password auth also failed:', err.message);
          process.exit(1);
        })
        .connect({
          host: '45.130.228.77',
          port: 65002,
          username: 'u441114691',
          password: password,
        });
    })
    .connect({
      host: '45.130.228.77',
      port: 65002,
      username: 'u441114691',
      privateKey: fs.readFileSync(keyPath),
      readyTimeout: 30000,
    });
}

connect();
