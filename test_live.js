
async function testFlow() {
  console.log('Registering user...');
  let res = await fetch('https://tdsupply.eu/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'antigravity_test2@example.com',
      password: 'password123',
      name: 'Antigravity Test',
      phone: '+40712345678',
      captchaToken: 'test'
    })
  });
  let body = await res.json();
  console.log('Register response:', res.status, body);

  console.log('Logging in...');
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
  console.log('Login response:', res.status, body);

  if (!body.accessToken) {
    console.log('Failed to get token!');
    return;
  }
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
