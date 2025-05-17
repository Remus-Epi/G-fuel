import React from 'react';

const Login = () => {
  return (
    <div class="login-container" id="loginForm">
        <h2>Login</h2>
        <input type="text" id="username" placeholder="Username" required/>
        <input type="password" id="password" placeholder="Password" required/>
        <button onclick="login()" type="button" class="btn btn-primary" value="Input">Login</button>
    </div>   
    );
};
export default Login;
