import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            // Log request data for debugging
            console.log('Login request:', { email, password });

            // Make the login request to the backend
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });

            // Log the response for debugging
            console.log('Login response:', response.data);

            const token = response.data.token;
            localStorage.setItem('token', token);
            alert('Login successful');
        } catch (error) {
            console.error('Login failed:', error.response?.data?.error || 'Unknown error');
            alert('Login failed: Invalid credentials');
        }
    };

    return (
        <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
