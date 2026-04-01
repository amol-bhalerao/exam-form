import https from 'https';
import http from 'http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGUiOiJJTlNUSVRVVEUiLCJpbnN0aXR1dGVJZCI6MSwidXNlcm5hbWUiOiJpbnN0aXR1dGUxIiwiaWF0IjoxNzc1MDMzODk0LCJleHAiOjE3NzUwMzQ3OTR9.as1MJK6XHBl0wodTiH7o42pD390zyExND_Z0mD_RNW8';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/institutes/me/stream-subjects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('✅ API Response - Streams and Subjects:');
    json.streams.forEach(stream => {
      console.log(`\n${stream.name}:`);
      stream.subjects.forEach(subj => {
        console.log(`  ✓ ${subj.name} (${subj.code})`);
      });
    });
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
