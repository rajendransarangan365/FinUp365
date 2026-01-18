import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Register = () => {
    const [name, setName] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/register', {
                email,
                password,
                name,
                agencyName
            });

            // Store Token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = "/";
        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration Failed: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-content">
                <div className="logo-area">
                    <h1>Create Account</h1>
                    <p>Join Fin FollowUp today.</p>
                </div>

                <div className="card login-card">
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Raja"
                                required
                                className="profile-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Agency</label>
                            <input
                                type="text"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                placeholder="e.g. FinUp Services"
                                required
                                className="profile-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="agent@example.com"
                                required
                                className="profile-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                                className="profile-input"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary full-width"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <button
                        className="btn-text"
                        style={{ marginTop: 16 }}
                        onClick={() => navigate('/login')}
                    >
                        Already have an account? Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;
