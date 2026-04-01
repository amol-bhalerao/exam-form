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
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: res.statusCode === 200 || res.statusCode === 201, data: json, status: res.statusCode });
        } catch (e) {
          resolve({ ok: false, data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Merge Mode (Unique Subjects Only)\n');
  console.log('='.repeat(60));

  // Step 1: Check current state
  console.log('\n📋 STEP 1: Current Mappings');
  let res = await makeRequest('/api/institutes/me/stream-subjects');
  if (res.ok) {
    res.data.streams.forEach(stream => {
      console.log(`  ${stream.name}: ${stream.subjects.map(s => s.name).join(', ') || 'No subjects'}`);
    });
  }

  // Step 2: Add NEW subjects to HSC.VOC (should add 2 new subjects)
  console.log('\n\n✅ STEP 2: Add NEW subjects to HSC.VOC (1, 8)');
  console.log('   Sending: English (1), Computer Science (8)');
  const payload2 = {
    streamSubjects: [{
      streamId: 4,  // HSC.VOC
      subjectIds: [1, 8]  // English, Computer Science
    }]
  };
  res = await makeRequest('/api/institutes/me/stream-subjects', 'POST', payload2);
  console.log(`   Status: ${res.status}`);
  console.log(`   Message: ${res.data.message}`);
  console.log(`   Added: ${res.data.count}, Duplicates Skipped: ${res.data.duplicatesSkipped || 0}`);

  // Step 3: Check updated state
  console.log('\n\n📋 STEP 3: Check Updated State');
  res = await makeRequest('/api/institutes/me/stream-subjects');
  if (res.ok) {
    res.data.streams.forEach(stream => {
      const subjects = stream.subjects.map(s => s.name).join(', ') || 'No subjects';
      console.log(`  ${stream.name}: ${subjects}`);
    });
  }

  // Step 4: Try to add mix of OLD (already exist) and NEW subjects (should skip old, add new)
  console.log('\n\n⚠️  STEP 4: Try Adding Mix of OLD (1, 8) and NEW (7) subjects');
  console.log('   Note: English (1) and Computer Science (8) already mapped');
  console.log('   Sending: English (1), Mathematics (7), Computer Science (8)');
  const payload4 = {
    streamSubjects: [{
      streamId: 4,  // HSC.VOC
      subjectIds: [1, 7, 8]  // English (old), Mathematics (new), Computer Science (old)
    }]
  };
  res = await makeRequest('/api/institutes/me/stream-subjects', 'POST', payload4);
  console.log(`   Status: ${res.status}`);
  console.log(`   Message: ${res.data.message}`);
  console.log(`   Added: ${res.data.count}, Duplicates Skipped: ${res.data.duplicatesSkipped || 0}`);
  console.log(`   ✓ Should skip 2 duplicates (English, Computer Science)`);
  console.log(`   ✓ Should add 1 new (Mathematics)`);

  // Step 5: Check final state - should have 4 subjects now
  console.log('\n\n📋 STEP 5: Final State (Should have 4 subjects for HSC.VOC)');
  res = await makeRequest('/api/institutes/me/stream-subjects');
  if (res.ok) {
    const vocStream = res.data.streams.find(s => s.id === 4);
    if (vocStream) {
      console.log(`  HSC.VOC (${vocStream.subjects.length} subjects):`);
      vocStream.subjects.forEach(s => console.log(`    ✓ ${s.name}`));
      
      if (vocStream.subjects.length === 4) {
        console.log('\n✅ SUCCESS: Merge mode working correctly!');
        console.log('   - All 4 subjects preserved and merged');
        console.log('   - Duplicates properly skipped');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
