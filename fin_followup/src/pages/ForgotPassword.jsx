import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Login.css'; // Reusing Login styles for consistency
import { FiArrowLeft, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: Security Question, 3: Success
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Error State
    const [error, setError] = useState('');

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setSecurityQuestion(data.securityQuestion);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "User not found or security question not set.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password-security', {
                email,
                answer,
                newPassword
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || "Incorrect answer or reset failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-content">
                <div className="logo-area">
                    <img src={logo} alt="Fin FollowUp" style={{ maxWidth: '200px', height: 'auto', marginBottom: '1rem' }} />
                    <p>Password Recovery</p>
                </div>

                <div className="card login-card">
                    {step === 1 && (
                        <form onSubmit={handleCheckEmail}>
                            <h3 style={{ margin: '0 0 16px', color: '#2d3436' }}>Find Account</h3>
                            <p style={{ fontSize: '0.9rem', color: '#636e72', marginBottom: '24px' }}>
                                Enter your email address to retrieve your security question.
                            </p>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@example.com"
                                    required
                                    className="full-width-input"
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: '#ffebee', color: '#c0392b',
                                    padding: '10px', borderRadius: '8px',
                                    fontSize: '0.85rem', marginTop: '16px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <FiAlertCircle /> {error}
                                </div>
                            )}

                            <button className="btn-primary full-width" style={{ marginTop: '24px' }} disabled={loading}>
                                {loading ? 'Checking...' : 'Next'}
                            </button>

                            <button
                                type="button"
                                className="back-link"
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'none', border: 'none', color: '#636e72',
                                    marginTop: '16px', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    width: '100%'
                                }}
                            >
                                <FiArrowLeft /> Back to Login
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleResetPassword}>
                            <h3 style={{ margin: '0 0 16px', color: '#2d3436' }}>Security Check</h3>

                            <div style={{
                                background: '#e3f2fd', padding: '12px', borderRadius: '8px',
                                borderLeft: '4px solid #3498db', marginBottom: '20px'
                            }}>
                                <label style={{ fontSize: '0.75rem', color: '#3498db', fontWeight: 'bold' }}>SECURITY QUESTION</label>
                                <p style={{ margin: '4px 0 0', fontWeight: '500', color: '#2d3436' }}>{securityQuestion}</p>
                            </div>

                            <div className="form-group">
                                <label>Your Answer</label>
                                <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Enter your answer"
                                    required
                                    className="full-width-input"
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Create new password"
                                    required
                                    className="full-width-input"
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: '#ffebee', color: '#c0392b',
                                    padding: '10px', borderRadius: '8px',
                                    fontSize: '0.85rem', marginTop: '16px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <FiAlertCircle /> {error}
                                </div>
                            )}

                            <button className="btn-primary full-width" style={{ marginTop: '24px' }} disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'none', border: 'none', color: '#636e72',
                                    marginTop: '16px', cursor: 'pointer',
                                    width: '100%', fontSize: '0.9rem'
                                }}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', background: '#e0f2f1',
                                color: '#009688', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', fontSize: '32px'
                            }}>
                                <FiCheck />
                            </div>
                            <h3>Password Reset!</h3>
                            <p style={{ color: '#636e72', marginBottom: '24px' }}>
                                Your password has been successfully updated. You can now login with your new password.
                            </p>
                            <button
                                className="btn-primary full-width"
                                onClick={() => navigate('/login')}
                            >
                                Continue to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
