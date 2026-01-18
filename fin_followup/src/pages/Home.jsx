import React, { useState } from 'react';
import CustomerCard from '../components/CustomerCard';
import { FaPlus, FaSearch, FaSignOutAlt, FaThLarge, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import logo from '../assets/logo.png';

import api from '../services/api';
import StatusUpdateDialog from '../components/StatusUpdateDialog';
import ProfileDialog from '../components/ProfileDialog';

const Home = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // For Dialog
    const [showProfile, setShowProfile] = useState(false); // For Profile Dialog
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    const handleLogout = () => {
        // ... logout logic ...
        // Direct logout for better UX/Mobile compatibility
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Hard reload to clear state cleanly
    };

    const handleUpdateUser = (updatedUser) => {
        // Trigger a re-render if needed, though state update in ProfileDialog might be enough if we re-read from localStorage
        // Or we can keep a user state in Home. For now, force update via key or setCustomers hack? 
        // Better: let's treat user as a state but for now just force update the button.
        window.dispatchEvent(new Event('storage')); // trigger updates if we listened to it, but we can just use a state.
    };

    const toggleView = () => setViewMode(prev => prev === 'list' ? 'grid' : 'list');

    const getUserInitial = () => {
        const u = JSON.parse(localStorage.getItem('user'));
        return u?.name?.charAt(0) || 'R';
    }

    const getUserPhoto = () => {
        const u = JSON.parse(localStorage.getItem('user'));
        return u?.photoUrl;
    }

    React.useEffect(() => {
        // ... existing effect ...
        const fetchCustomers = async () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser || !storedUser._id) return;

            try {
                const { data } = await api.get(`/customers/${storedUser._id}`);
                // Transform data to match UI expectations if needed
                const transformed = data.map(c => ({
                    ...c,
                    id: c._id // Mongo _id to id
                }));
                setCustomers(transformed);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleCall = (customer) => {
        // ... existing ...
        setSelectedCustomer(customer);
    };

    const handleUpdateStatus = async (customerId, updateData) => {
        try {
            // Determine status logic
            let newStatus = updateData.status;
            if (newStatus === 'RESCHEDULE') newStatus = 'NORMAL';

            let responseData; // To store backend response

            if (updateData.audioBlob) {
                // Use FormData for File Upload
                const formData = new FormData();
                formData.append('status', newStatus);
                formData.append('followUpDate', updateData.nextDate);
                formData.append('note', updateData.note);
                formData.append('audio', updateData.audioBlob, 'status_update.webm');

                const { data } = await api.patch(`/customers/${customerId}/status`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                responseData = data;
            } else {
                // Regular JSON Update
                const { data } = await api.patch(`/customers/${customerId}/status`, {
                    status: newStatus,
                    followUpDate: updateData.nextDate,
                    note: updateData.note
                });
                responseData = data;
            }

            // Optimistic Update (or use responseData)
            setCustomers(prev => prev.map(c => {
                if (c.id === customerId) {
                    // We can use responseData to get the exact history item, including the cloud URL
                    // But for immediate feedback, we can just use the backend response directly which usually returns the updated customer
                    // Or we can construct it manually. Let's use the backend response.
                    return { ...c, ...responseData, id: c.id };
                }
                return c;
            }));
        } catch (e) {
            console.error(e);
            alert("Update failed");
        }
    };

    // ... filters ...
    // --- Smart Filtering Logic ---
    const todayStr = new Date().toISOString().split('T')[0];

    // "New": Status is explicitly NEW
    const newLeads = customers.filter(c => c.status === 'NEW');

    // "Action Needed": FollowUp is Today/Past AND status is NORMAL (not NEW, not Done)
    const actionNeeded = customers.filter(c => {
        if (c.status === 'NEW' || c.status === 'CONVERTED' || c.status === 'NOT_INTERESTED' || c.status === 'DONE') return false;
        return c.followUpDate <= todayStr;
    });

    // "Upcoming": Future date AND status is NORMAL
    const upcoming = customers.filter(c => {
        if (c.status === 'NEW' || c.status === 'CONVERTED' || c.status === 'NOT_INTERESTED' || c.status === 'DONE') return false;
        return c.followUpDate > todayStr;
    });

    // "Completed": Deals Closed or Not Interested
    const completed = customers.filter(c =>
        c.status === 'CONVERTED' || c.status === 'NOT_INTERESTED' || c.status === 'DONE'
    );

    return (
        <div className="crm-dashboard">
            {/* Soft UI Header */}
            <header className="crm-header">
                <div>
                    <img src={logo} alt="Fin FollowUp" className="brand-logo" style={{ maxHeight: '50px', height: 'auto' }} />
                    <p className="crm-subtitle">Good evening</p>
                </div>
                <div className="header-actions">
                    <button className="crm-icon-btn" onClick={toggleView} title="Toggle View">
                        {viewMode === 'list' ? <FaThLarge /> : <FaList />}
                    </button>
                    <button className="crm-icon-btn" onClick={handleLogout} title="Log Out">
                        <FaSignOutAlt color="#e74c3c" />
                    </button>
                    <button
                        className="crm-icon-btn profile-btn"
                        onClick={() => setShowProfile(true)}
                        style={{ padding: 0, overflow: 'hidden' }}
                    >
                        {getUserPhoto() ? (
                            <img src={getUserPhoto()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            getUserInitial()
                        )}
                    </button>
                </div>
            </header>

            {/* Stats / Quick Glance */}
            <div className="stats-row">
                <div className="stat-card active">
                    <span className="stat-label">To Call</span>
                    <span className="stat-value">{actionNeeded.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Pipeline</span>
                    <span className="stat-value">{upcoming.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Closed</span>
                    <span className="stat-value">{completed.length}</span>
                </div>
            </div>

            <div className="crm-content">

                {/* Section 0: New Arrivals (Fresh Leads) */}
                {newLeads.length > 0 && (
                    <section className="crm-section">
                        <div className="section-header">
                            <h2>✨ New Arrivals</h2>
                            <span className="count-badge new-badge">{newLeads.length} new</span>
                        </div>
                        <div className="crm-list">
                            {newLeads.map(c => (
                                <CustomerCard key={c.id} customer={c} onCall={handleCall} variant="new" />
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 1: Priority (Red/Orange Theme) */}
                <section className="crm-section">
                    <div className="section-header">
                        <h2>🚀 Action Required</h2>
                        <span className="count-badge">{actionNeeded.length} leads</span>
                    </div>
                    {actionNeeded.length > 0 ? (
                        <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                            {actionNeeded.map(customer => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    onCall={handleCall}
                                    variant="urgent"
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">All caught up! Great job.</p>
                    )}
                </section>

                {/* Section 2: Pipeline (Blue/Clean Theme) */}
                <section className="crm-section">
                    <div className="section-header">
                        <h2>📅 Upcoming</h2>
                    </div>
                    <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                        {upcoming.map(c => (
                            <CustomerCard key={c.id} customer={c} onCall={handleCall} variant="normal" />
                        ))}
                        {upcoming.length === 0 && <p className="empty-state">No upcoming follow-ups.</p>}
                    </div>
                </section>

                {/* Section 3: History (Muted) */}
                {completed.length > 0 && (
                    <section className="crm-section">
                        <div className="section-header">
                            <h2>✅ Closed / Done <span className="count-badge">{completed.length}</span></h2>
                        </div>
                        <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                            {completed.map(customer => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    onCall={handleCall}
                                    variant="completed"
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Floating Add Button - Neumorphic */}
            <button className="crm-fab" onClick={() => navigate('/add-customer')}>
                <FaPlus />
                <span>Add Lead</span>
            </button>

            {selectedCustomer && (
                <StatusUpdateDialog
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onUpdate={handleUpdateStatus}
                />
            )}

            {showProfile && (
                <ProfileDialog
                    user={JSON.parse(localStorage.getItem('user')) || { name: 'User', email: '', agencyName: '' }}
                    onClose={() => setShowProfile(false)}
                    onUpdateUser={handleUpdateUser}
                />
            )}
        </div>
    );
};

export default Home;
