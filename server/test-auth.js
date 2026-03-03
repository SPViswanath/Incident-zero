import 'dotenv/config';

async function testRegistration() {
  const url = 'http://localhost:3000/api/auth/register';
  const timestamp = Date.now();
  
  const userData = {
    username: `testuser_${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'password123',
    role: 'ENGINEER'
  };

  try {
    console.log(`Sending POST request to ${url}...`);
    console.log('User data:', userData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    console.log('\n--- Status Code ---');
    console.log(response.status);
    
    console.log('\n--- Response Body ---');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Registration Successful!');
    } else {
      console.log('\n❌ Registration Failed!');
    }
  } catch (error) {
    console.error('\n❌ Could not connect or error occurred:', error.message);
    console.log('Make sure the server is running on port 3000! (npm start or node src/server.js)');
  }
}

testRegistration();
