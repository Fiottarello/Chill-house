import crypto from 'crypto';

async function test() {
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alberodinatale@gmail.com', password: 'password' })
  });
  
  const cookies = loginRes.headers.raw()['set-cookie'];
  if (!cookies) {
    console.log("Login failed");
    return;
  }
  
  const cookie = cookies[0].split(';')[0];
  
  const preRes = await fetch('http://localhost:3001/api/user/prenotazioni', {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  
  const data = await preRes.json();
  console.log(data);
}

test();
