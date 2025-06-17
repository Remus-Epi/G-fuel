function login() {
  // Get input values
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // Simple validation
  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  // Example: Check credentials (replace with real authentication)
  if (username === 'admin' && password === 'password') {
    alert('Login successful!');
    // Redirect or update UI as needed
  } else {
    alert('Invalid username or password.');
  }
}