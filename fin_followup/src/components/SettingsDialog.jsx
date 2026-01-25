import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaClock } from 'react-icons/fa';
import api from '../services/api';
import NotificationService from '../services/NotificationService';
import '../styles/SettingsDialog.css';

const SettingsDialog = ({ isOpen, onClose, user, onUpdate }) => {
    const [reminderHours, setReminderHours] = useState(user?.reminderHoursBefore || 2);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user?.reminderHoursBefore !== undefined) {
            setReminderHours(user.reminderHoursBefore);
        }
    }, [user]);

    const handleRequestPermission = async () => {
        const granted = await NotificationService.requestPermission();
        setNotificationPermission(Notification.permission);

        if (granted) {
            setMessage('✅ Notification permission granted!');
        } else {
            setMessage('❌ Notification permission denied. Please enable in browser settings.');
        }

        setTimeout(() => setMessage(''), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const response = await api.patch(`/auth/settings/${user._id}`, {
                reminderHoursBefore: reminderHours
            });

            // Update local storage
            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Call parent update
            if (onUpdate) {
                onUpdate(updatedUser);
            }

            setMessage('✅ Settings saved successfully!');
            setTimeout(() => {
                setMessage('');
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('❌ Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const reminderOptions = [
        { value: 0.5, label: '30 minutes before' },
        { value: 1, label: '1 hour before' },
        { value: 2, label: '2 hours before' },
        { value: 4, label: '4 hours before' },
        { value: 6, label: '6 hours before' },
        { value: 12, label: '12 hours before' },
        { value: 24, label: '1 day before' }
    ];

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
                <header className="dialog-header">
                    <h2><FaClock /> Reminder Settings</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </header>

                <div className="dialog-body">
                    {/* Notification Permission Section */}
                    <div className="settings-section">
                        <h3><FaBell /> Browser Notifications</h3>
                        <div className="permission-status">
                            <span className={`status-indicator ${notificationPermission === 'granted' ? 'granted' : 'denied'}`}>
                                {notificationPermission === 'granted' ? '✓ Enabled' : '✗ Disabled'}
                            </span>
                            {notificationPermission !== 'granted' && (
                                <button className="btn-secondary" onClick={handleRequestPermission}>
                                    Enable Notifications
                                </button>
                            )}
                        </div>
                        <p className="help-text">
                            {notificationPermission === 'granted'
                                ? 'You will receive reminders before meetings.'
                                : 'Enable notifications to receive meeting reminders.'}
                        </p>
                    </div>

                    {/* Reminder Timing Section */}
                    <div className="settings-section">
                        <h3>Reminder Timing</h3>
                        <label htmlFor="reminder-hours">Remind me:</label>
                        <select
                            id="reminder-hours"
                            value={reminderHours}
                            onChange={(e) => setReminderHours(Number(e.target.value))}
                            className="reminder-select"
                        >
                            {reminderOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="help-text">
                            You'll be notified {reminderHours >= 1 ? `${reminderHours} hour${reminderHours > 1 ? 's' : ''}` : '30 minutes'} before each meeting.
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                </div>

                <footer className="dialog-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsDialog;
