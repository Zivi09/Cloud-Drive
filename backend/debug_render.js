

async function debug() {
  try {
    const randomEmail = `testuser_${Math.floor(Math.random()*10000)}@gmail.com`;
    const signupRes = await fetch('https://cloud-drive-47m6.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: randomEmail, password: 'password123' })
    });
    
    let token;
    console.log("Signup Status:", signupRes.status);
    const signupData = await signupRes.text();
    console.log("Signup Response:", signupData.substring(0, 100));
    try {
      token = JSON.parse(signupData).token;
    } catch(e) {}

    if (!token) {
      const loginRes = await fetch('https://cloud-drive-47m6.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser2@gmail.com', password: 'password123' })
      });
      const loginData = await loginRes.text();
      console.log("Login Status:", loginRes.status);
      console.log("Login Response:", loginData.substring(0, 100));
      token = JSON.parse(loginData).token;
    }

    const FormData = require('form-data');
    const fs = require('fs');
    const form = new FormData();
    form.append('name', 'test_image');
    // We can just append a dummy string instead of a real file for testing if multer catches it, but CloudinaryStorage needs a file stream
    // Let's create a dummy file
    fs.writeFileSync('dummy.jpg', 'fake image data');
    form.append('image', fs.createReadStream('dummy.jpg'));

    const uploadRes = await fetch('https://cloud-drive-47m6.onrender.com/api/images', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
      body: form // node-fetch handles multipart/form-data with form-data package
    });
    const uploadText = await uploadRes.text();
    console.log('Upload Status:', uploadRes.status);
    console.log('Upload Response:', uploadText);
  } catch (error) {
    console.error(error);
  }
}
debug();
