const r = await fetch('http://localhost:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'institute1',password:'Password@123'})});
console.log(await r.text());
