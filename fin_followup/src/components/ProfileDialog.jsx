import React, { useState } from 'react';
import '../styles/StatusUpdateDialog.css'; // Reuse existing nice styles
import { FiX, FiLock, FiCheck } from 'react-icons/fi';
import api from '../services/api';

const ProfileDialog = ({ user, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            alert("Password updated successfully!");
            onClose();
        } catch (error) {
            alert(error.response?.data?.error || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-card">
                <div className="dialog-header">
                    <h3>My Profile</h3>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="profile-info-section" style={{ padding: '0 24px 24px' }}>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{user.name}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{user.email}</p>
                        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{user.agencyName}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h4 style={{ marginBottom: '16px' }}>Change Password</h4>

                        <div className="update-option" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: '16px' }}>
                            <div className="input-with-icon" style={{ width: '100%', position: 'relative' }}>
                                <FiLock style={{ position: 'absolute', left: 12, top: 12, color: '#aaa' }} />
                                <input
                                    type="password"
                                    placeholder="Old Password"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="update-option" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: '16px' }}>
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>

                        <div className="update-option" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: '24px' }}>
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="save-btn"
                            disabled={loading}
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                        >
                            {loading ? 'Updating...' : <><FiCheck /> Update Password</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileDialog;
