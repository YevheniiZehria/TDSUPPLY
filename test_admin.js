
async function testFlow() {
  console.log('Logging in as Admin...');
  let res = await fetch('https://tdsupply.eu/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@tdsupply.eu',
      password: 'password123'
    })
  });
  let body = await res.json();
  console.log('Admin login response:', res.status, body);

  if (!body.accessToken) {
    console.log('Failed to get admin token!');
    return;
  }
  const adminToken = body.accessToken;

  console.log('Activating user...');
  res = await fetch('https://tdsupply.eu/api/admin/users-api/7c7a1a1b-c9c9-448a-a37f-c1f7949dcd95/toggle-active', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  body = await res.json();
  console.log('Activate response:', res.status, body);

  console.log('Logging in as user...');
  res = await fetch('https://tdsupply.eu/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'antigravity_test2@example.com',
      password: 'password123',
      captchaToken: 'test'
    })
  });
  body = await res.json();
  console.log('User login response:', res.status, body);

  const token = body.accessToken;

  console.log('Placing order...');
  res = await fetch('https://tdsupply.eu/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        { id: '123', quantity: 1 }
      ],
      deliveryAddress: {
        strada: 'Strada Test 123',
        oras: 'Bucuresti',
        judet: 'Bucuresti',
        codPostal: '123456',
        telefon: '+40712345678'
      }
    })
  });
  body = await res.json();
  console.log('Order response:', res.status, body);
}

testFlow();
