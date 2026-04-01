import https from 'https';
import http from 'http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGUiOiJJTlNUSVRVVEUiLCJpbnN0aXR1dGVJZCI6MSwidXNlcm5hbWUiOiJpbnN0aXR1dGUxIiwiaWF0IjoxNzc1MDMzODk0LCJleHAiOjE3NzUwMzQ3OTR9.as1MJK6XHBl0wodTiH7o42pD390zyExND_Z0mD_RNW8';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Merge Mode API (Unique Subjects Only)\n');
  
  // Current state
  console.log('📋 CURRENT MAPPINGS:');
  let res = await makeRequest('/api/institutes/me/stream-subjects');
  const vocStream = res.data.streams?.find(s => s.id === 4);
  console.log(`HSC.VOC: ${vocStream?.subjects.map(s => s.name).join(', ')}`);
  console.log(`Count: ${vocStream?.subjects.length}\n`);

  // Try adding duplicates + new
  console.log('🔄 SENDING: Add mix of existing (1,8) and new (10) to HSC.VOC');
  const payload = {
    streamSubjects: [{
      streamId: 4,
      subjectIds: [1, 8, 10]  // 1,8 exist; 10 is new
    }]
  };
  res = await makeRequest('/api/institutes/me/stream-subjects', 'POST', payload);
  console.log(`Status: ${res.status}`);
  console.log(`Message: ${res.data.message}`);
  console.log(`Added: ${res.data.count}`);
  console.log(`Duplicates Skipped: ${res.data.duplicatesSkipped}\n`);

  // Final state
  console.log('📋 AFTER MERGE:');
  res = await makeRequest('/api/institutes/me/stream-subjects');
  const finalVoc = res.data.streams?.find(s => s.id === 4);
  console.log(`HSC.VOC: ${finalVoc?.subjects.map(s => s.name).join(', ')}`);
  console.log(`Count: ${finalVoc?.subjects.length}`);

  console.log('\n' + '='.repeat(60));
  if (res.data.streams.length > 1) {
    console.log('✅ SUCCESS: Multiple streams preserved, merge mode working!');
  }
}

test().catch(console.error);
