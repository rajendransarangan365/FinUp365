import React, { useState } from 'react';
import CustomerCard from '../components/CustomerCard';
import { FaPlus, FaSearch, FaSignOutAlt, FaThLarge, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import logo from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';

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
        window.dispatchEvent(new Event('storage'));
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
                console.log("Raw Customers Data:", data);
                const transformed = data.map((c, index) => {
                    // Normalize 'Today' to actual YYYY-MM-DD (Local Time)
                    let fDate = c.followUpDate;
                    if (fDate === 'Today') {
                        const now = new Date();
                        fDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                    }

                    return {
                        ...c,
                        id: c._id || `temp-${index}-${Date.now()}`, // Fallback for Mongo _id
                        followUpDate: fDate
                    };
                });
                // Sort action needed by date? (Optional, but good for UX)
                // transformed.sort((a,b) => new Date(a.followUpDate) - new Date(b.followUpDate));

                console.log("Transformed Customers:", transformed);
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
    // --- Smart Filtering Logic ---
    // Use local date for accurate day comparison
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // "New": Status is explicitly NEW
    const newLeads = customers.filter(c => c.status === 'NEW');

    // "Action Needed": Status is TODAY -OR- (Status is NORMAL and date is Today/Past)
    const actionNeeded = customers.filter(c => {
        // Exclude other statuses
        if (['NEW', 'CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)) return false;

        // Explicit TODAY status
        if (c.status === 'TODAY') return true;

        // Date check for NORMAL status
        return c.followUpDate && c.followUpDate <= todayStr;
    });

    // "Upcoming": Future date AND (Status is NORMAL)
    const upcoming = customers.filter(c => {
        // Exclude other statuses
        if (['NEW', 'TODAY', 'CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)) return false;

        return c.followUpDate && c.followUpDate > todayStr;
    });

    // "Completed": Deals Closed or Not Interested
    const completed = customers.filter(c =>
        ['CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)
    );

    // console.log('--- Debug Filtering ---');
    // ... (removed)

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0 } // Add exit variant
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="crm-dashboard">
            {/* Header */}
            <header className="crm-header">
                <div>
                    <motion.img
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        src={logo} alt="Fin FollowUp" className="brand-logo"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="crm-subtitle"
                    >
                        Good evening
                    </motion.p>
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
                        style={{ padding: 0 }}
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
            <motion.div
                className="stats-row"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
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
            </motion.div>

            <div className="crm-content">
                {/* Content Sections - Simplified for Visibility */}

                {/* Section 0: New Arrivals (Fresh Leads) */}
                {newLeads.length > 0 && (
                    <motion.section
                        className="crm-section"
                        initial="hidden" animate="visible" variants={containerVariants}
                    >
                        <div className="section-header">
                            <h2>✨ New Arrivals</h2>
                            <span className="count-badge new-badge">{newLeads.length} new</span>
                        </div>
                        <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                            {newLeads.map(c => (
                                <div key={c.id} className="crm-item-wrapper">
                                    <CustomerCard customer={c} onCall={handleCall} variant="new" />
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Section 1: Priority (Red/Orange Theme) */}
                <motion.section
                    className="crm-section"
                    initial="hidden" animate="visible" variants={containerVariants}
                >
                    <div className="section-header">
                        <h2>🚀 Action Required</h2>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textDecoration: 'underline'
                            }}
                        >
                            Refresh Data
                        </button>
                        <span className="count-badge">{actionNeeded.length} leads</span>
                    </div>
                    {actionNeeded.length > 0 ? (
                        <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                            {actionNeeded.map(customer => (
                                <div key={customer.id} className="crm-item-wrapper">
                                    <CustomerCard
                                        customer={customer}
                                        onCall={handleCall}
                                        variant="urgent"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">All caught up! Great job.</p>
                    )}
                </motion.section>

                {/* Section 2: Pipeline (Blue/Clean Theme) */}
                <motion.section
                    className="crm-section"
                    initial="hidden" animate="visible" variants={containerVariants}
                >
                    <div className="section-header">
                        <h2>📅 Upcoming</h2>
                    </div>
                    <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                        {upcoming.map(c => (
                            <div key={c.id} className="crm-item-wrapper">
                                <CustomerCard customer={c} onCall={handleCall} variant="normal" />
                            </div>
                        ))}
                        {upcoming.length === 0 && <p className="empty-state">No upcoming follow-ups.</p>}
                    </div>
                </motion.section>

                {/* Section 3: History (Muted) */}
                {completed.length > 0 && (
                    <motion.section
                        className="crm-section"
                        initial="hidden" animate="visible" variants={containerVariants}
                    >
                        <div className="section-header">
                            <h2>✅ Closed / Done <span className="count-badge">{completed.length}</span></h2>
                        </div>
                        <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                            {completed.map(customer => (
                                <div key={customer.id} className="crm-item-wrapper">
                                    <CustomerCard
                                        customer={customer}
                                        onCall={handleCall}
                                        variant="completed"
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>

            {/* Floating Add Button - Neumorphic */}
            <motion.button
                className="fab crm-fab"
                onClick={() => navigate('/add-customer')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <FaPlus />
                <span>Add Lead</span>
            </motion.button>

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
