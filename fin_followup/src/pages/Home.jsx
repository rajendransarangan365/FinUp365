import React, { useState, useEffect } from 'react';
import CustomerCard from '../components/CustomerCard';

import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import logo from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../services/api';
import StatusUpdateDialog from '../components/StatusUpdateDialog';
import ProfileDialog from '../components/ProfileDialog';
import CallDispositionDialog from '../components/CallDispositionDialog';
import FilterBar from '../components/FilterBar';
import SettingsDialog from '../components/SettingsDialog';
import TemplateManagerDialog from '../components/TemplateManagerDialog';
import NotificationService from '../services/NotificationService';
import { FaPlus, FaSearch, FaSignOutAlt, FaThLarge, FaList, FaUserCog, FaTimes, FaChartBar, FaCog, FaTasks, FaWhatsapp } from 'react-icons/fa';

const Home = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // For Dialog
    const [callingCustomer, setCallingCustomer] = useState(null); // For Call Dialog
    const [showProfile, setShowProfile] = useState(false); // For Profile Dialog
    const [showProfileMenu, setShowProfileMenu] = useState(false); // For Sidebar Menu
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [showStats, setShowStats] = useState(false); // Stats visibility toggle
    const [filters, setFilters] = useState({
        status: 'ALL',
        dateRange: 'ALL',
        search: ''
    });
    const [activeTab, setActiveTab] = useState('reminder');

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Settings and notification
    const [showSettings, setShowSettings] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [activeWorkflow, setActiveWorkflow] = useState(null);

    // Fetch Active Workflow if exists
    useEffect(() => {
        const fetchWorkflow = async () => {
            if (currentUser?.activeWorkflowId) {
                try {
                    // We need a way to get specific or just filter
                    // Actually, we can just fetch all and find the active one, or add an endpoint.
                    // For now, let's just fetch the specific one by ID if we had an endpoint, or user the workflows list

                    // Let's use the list endpoint and find it
                    const res = await api.get(`/workflows/${currentUser._id || currentUser.id}`);

                    const active = res.data.find(w => w._id == currentUser.activeWorkflowId);

                    if (active) {
                        setActiveWorkflow(active);
                        setActiveTab(active.steps[0]); // Default to first step
                    }
                } catch (e) {
                    console.error("Failed to load workflow", e);
                }
            } else {
                setActiveWorkflow(null);
            }
        };
        fetchWorkflow();
    }, [currentUser]);

    const handleLogout = () => {
        // ... logout logic ...
        // Direct logout for better UX/Mobile compatibility
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Hard reload to clear state cleanly
    };

    const handleUpdateUser = (updatedUser) => {
        setCurrentUser(updatedUser);
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

    // Fetch customers with pagination
    const fetchCustomers = async (pageNum = 1, append = false) => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser._id) return;

        try {
            if (append) {
                setIsFetchingMore(true);
            } else {
                setLoading(true);
            }

            const { data } = await api.get(`/customers/${storedUser._id}?page=${pageNum}&limit=10`);

            console.log("API Response:", data); // Debug log

            let customersData = [];
            let paginationData = { hasMore: false };

            // Handle both old format (array) and new format (object with customers)
            if (Array.isArray(data)) {
                // Old format: data is directly an array of customers
                console.warn("Received old API format (array). Consider updating backend.");
                customersData = data;
                paginationData.hasMore = false; // No pagination in old format
            } else if (data && data.customers) {
                // New format: data has customers array and pagination object
                customersData = data.customers;
                paginationData = data.pagination || {};
            } else {
                console.error("Invalid API response:", data);
                setCustomers([]);
                setHasMore(false);
                return;
            }

            // Transform data
            const transformed = customersData.map((c, index) => {
                let fDate = c.followUpDate;
                if (fDate === 'Today') {
                    const now = new Date();
                    fDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                }

                return {
                    ...c,
                    id: c._id || `temp-${index}-${Date.now()}`,
                    followUpDate: fDate
                };
            });

            if (append) {
                setCustomers(prev => [...prev, ...transformed]);
            } else {
                setCustomers(transformed);
            }

            setHasMore(paginationData.hasMore || false);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch customers", error);
            setCustomers([]); // Set empty array on error
            setHasMore(false);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    React.useEffect(() => {
        fetchCustomers(1, false);

        // Request notification permission and check upcoming meetings
        NotificationService.requestPermission().then(() => {
            // Will check meetings after customers are loaded
        });
    }, []);

    // Infinite scroll effect
    React.useEffect(() => {
        const handleScroll = () => {
            // Check if user has scrolled near bottom (within 500px)
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollHeight - scrollTop - clientHeight < 500) {
                // Near bottom, fetch more if available and not already fetching
                if (hasMore && !isFetchingMore && !loading) {
                    fetchCustomers(page + 1, true);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetchingMore, loading, page]);

    const handleCall = (customer) => {
        // ... existing ...
        setSelectedCustomer(customer);
    };

    const handleCallAction = (customer) => {
        // 1. Trigger the actual call
        window.location.href = `tel:${customer.phone}`;

        // 2. Open the Disposition Dialog
        setCallingCustomer(customer);
    };

    const handleSaveCallLog = async (customerId, logData) => {
        try {
            const { data } = await api.post(`/customers/${customerId}/call-log`, logData);

            // Update local state
            setCustomers(prev => prev.map(c => {
                if (c.id === customerId) {
                    return { ...c, ...data, id: c.id };
                }
                return c;
            }));
        } catch (error) {
            console.error("Failed to save call log", error);
            alert("Failed to save call log");
        }
    };

    const handleUpdateStatus = async (customerId, updateData) => {
        try {
            // Determine status logic
            let newStatus = updateData.status;
            if (newStatus === 'RESCHEDULE') newStatus = 'NORMAL';

            let responseData; // To store backend response

            if (updateData.audioBlob) {
                // Use FormData for File Upload
                console.log('📤 Audio Blob detected, size:', updateData.audioBlob.size, 'bytes');
                console.log('📤 Audio Blob type:', updateData.audioBlob.type);
                console.log('📤 Audio Blob instanceof Blob:', updateData.audioBlob instanceof Blob);

                const formData = new FormData();
                formData.append('status', newStatus);

                // Only append date if it exists
                if (updateData.nextDate) {
                    formData.append('followUpDate', updateData.nextDate);
                }

                formData.append('note', updateData.note || '');

                // Convert Blob to File with proper filename
                const audioFile = new File([updateData.audioBlob], 'status_update.webm', {
                    type: 'audio/webm'
                });
                console.log('📤 Created File object:', audioFile.name, audioFile.size, 'bytes');
                formData.append('audio', audioFile);

                console.log('📤 FormData created, sending to backend...');

                const { data } = await api.patch(`/customers/${customerId}/status`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log('✅ Backend response:', data);
                responseData = data;
            } else {
                // Regular JSON Update
                const payload = {
                    status: newStatus,
                    note: updateData.note || ''
                };
                if (updateData.nextDate) {
                    payload.followUpDate = updateData.nextDate;
                }

                const { data } = await api.patch(`/customers/${customerId}/status`, payload);
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

    // Filter Handler
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Apply Filters to Customers
    const applyFilters = (customerList) => {
        let filtered = [...customerList];

        // Status Filter
        if (filters.status !== 'ALL') {
            filtered = filtered.filter(c => (c.status || '').toLowerCase() === filters.status.toLowerCase());
        }

        // Date Range Filter
        if (filters.dateRange !== 'ALL') {
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

            filtered = filtered.filter(c => {
                if (!c.followUpDate) return false;

                const followUpDate = new Date(c.followUpDate);
                const followUpStr = c.followUpDate;

                switch (filters.dateRange) {
                    case 'TODAY':
                        return followUpStr === todayStr;

                    case 'THIS_WEEK':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                        return followUpDate >= weekStart && followUpDate <= weekEnd;

                    case 'THIS_MONTH':
                        return followUpDate.getMonth() === today.getMonth() &&
                            followUpDate.getFullYear() === today.getFullYear();

                    default:
                        return true;
                }
            });
        }

        // Search Filter
        if (filters.search.trim() !== '') {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(c => {
                const name = (c.name || '').toLowerCase();
                const customerName = (c.customerName || '').toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                return name.includes(searchLower) ||
                    customerName.includes(searchLower) ||
                    phone.includes(searchLower);
            });
        }

        return filtered;
    };

    // ... filters ...
    // --- Smart Filtering Logic ---
    // --- Smart Filtering Logic ---
    // Use local date for accurate day comparison
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Apply filters first
    const filteredCustomers = applyFilters(customers);

    // "New": Status is explicitly NEW
    const newLeads = filteredCustomers.filter(c => c.status === 'NEW');

    // "Action Needed": Status is TODAY -OR- (Status is NORMAL and date is Today/Past)
    const actionNeeded = filteredCustomers.filter(c => {
        // Exclude other statuses
        if (['NEW', 'CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)) return false;

        // Explicit TODAY status
        if (c.status === 'TODAY') return true;

        // Date check for NORMAL status
        return c.followUpDate && c.followUpDate <= todayStr;
    });

    // "Upcoming": Future date AND (Status is NORMAL)
    const upcoming = filteredCustomers.filter(c => {
        // Exclude other statuses
        if (['NEW', 'TODAY', 'CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)) return false;

        return c.followUpDate && c.followUpDate > todayStr;
    });

    // "Completed": Deals Closed or Not Interested
    const completed = filteredCustomers.filter(c =>
        ['CONVERTED', 'NOT_INTERESTED', 'DONE'].includes(c.status)
    );

    // --- Dynamic Workflow Filtering ---
    const getWorkflowCustomers = (stepName) => {
        return filteredCustomers.filter(c => (c.status || '').toLowerCase() === stepName.toLowerCase());
    };

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
                <div className="brand-wrapper">
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
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good morning';
                            if (hour < 18) return 'Good afternoon';
                            return 'Good evening';
                        })()}
                    </motion.p>
                </div>
                <div className="header-actions">
                    <button
                        className={`crm-icon-btn ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title="Toggle Stats"
                        style={{ color: showStats ? 'var(--color-primary)' : 'inherit' }}
                    >
                        <FaChartBar />
                    </button>
                    <button className="crm-icon-btn" onClick={toggleView} title="Toggle View">
                        {viewMode === 'list' ? <FaThLarge /> : <FaList />}
                    </button>
                    {/* Logout moved to Profile Dialog */}
                    <button
                        className="crm-icon-btn profile-btn"
                        onClick={() => setShowProfileMenu(true)}
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
            <AnimatePresence>
                {showStats && (
                    <motion.div
                        className="stats-row"
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
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
                )}
            </AnimatePresence>

            {/* Tabs Navigation */}
            <div className="tabs-nav">
                {activeWorkflow ? (
                    // WORKFLOW TABS
                    activeWorkflow.steps.map(step => {
                        const count = getWorkflowCustomers(step).length;
                        return (
                            <button
                                key={step}
                                className={`tab-btn ${activeTab === step ? 'active' : ''}`}
                                onClick={() => setActiveTab(step)}
                            >
                                {step}
                                {count > 0 && <span className="count-badge" style={{ marginLeft: '6px', fontSize: '0.7em', verticalAlign: 'middle', background: activeTab === step ? 'white' : '#eee', color: activeTab === step ? 'black' : '#666' }}>{count}</span>}
                            </button>
                        );
                    })
                ) : (
                    // STANDARD TABS
                    <>
                        <button
                            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                            onClick={() => setActiveTab('new')}
                        >
                            New
                            {newLeads.length > 0 && <span className="count-badge new-badge" style={{ marginLeft: '6px', fontSize: '0.7em', verticalAlign: 'middle' }}>{newLeads.length}</span>}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reminder' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reminder')}
                        >
                            Reminder
                            {actionNeeded.length > 0 && <span className="count-badge" style={{ marginLeft: '6px', fontSize: '0.7em', verticalAlign: 'middle' }}>{actionNeeded.length}</span>}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Upcoming
                            {upcoming.length > 0 && <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: '6px' }}>({upcoming.length})</span>}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'closed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('closed')}
                        >
                            Closed
                        </button>
                    </>
                )}
            </div>

            {/* Filter Bar */}
            <FilterBar
                onFilterChange={handleFilterChange}
                activeFilters={filters}
                totalCount={customers.length}
                filteredCount={filteredCustomers.length}
                activeWorkflow={activeWorkflow}
            />

            <div className="crm-content">
                {/* Content Sections - Simplified for Visibility */}

                {/* --- DYNAMIC WORKFLOW CONTENT --- */}
                {activeWorkflow ? (
                    <motion.section
                        key={activeTab} // Re-mount animation on tab change
                        className="crm-section"
                        initial="hidden" animate="visible" variants={containerVariants}
                    >
                        <div className="section-header">
                            <h2>{activeTab}</h2>
                            <span className="count-badge">{getWorkflowCustomers(activeTab).length}</span>
                        </div>

                        {getWorkflowCustomers(activeTab).length > 0 ? (
                            <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                                {getWorkflowCustomers(activeTab).map(c => (
                                    <div key={c.id} className="crm-item-wrapper">
                                        {/* Pass context to card so it knows it's a workflow item? Or just generic */}
                                        <CustomerCard customer={c} onCall={handleCall} onCallAction={handleCallAction} variant="normal" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No customers in {activeTab}.</p>
                        )}
                    </motion.section>
                ) : (
                    // STANDARD CONTENT
                    <>
                        {/* --- NEW TAB --- */}
                        {activeTab === 'new' && (
                            <motion.section
                                className="crm-section"
                                initial="hidden" animate="visible" variants={containerVariants}
                            >
                                <div className="section-header">
                                    <h2>✨ New Arrivals</h2>
                                    <span className="count-badge new-badge">{newLeads.length} new</span>
                                </div>
                                {newLeads.length > 0 ? (
                                    <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                                        {newLeads.map(c => (
                                            <div key={c.id} className="crm-item-wrapper">
                                                <CustomerCard customer={c} onCall={handleCall} onCallAction={handleCallAction} variant="new" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">No new leads at the moment.</p>
                                )}
                            </motion.section>
                        )}

                        {/* --- REMINDER TAB --- */}
                        {activeTab === 'reminder' && (
                            <motion.section
                                className="crm-section"
                                initial="hidden" animate="visible" variants={containerVariants}
                            >
                                <div className="section-header">
                                    <h2>🚀 Action Required</h2>
                                    <span className="count-badge">{actionNeeded.length} leads</span>
                                </div>
                                {actionNeeded.length > 0 ? (
                                    <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                                        {actionNeeded.map(customer => (
                                            <div key={customer.id} className="crm-item-wrapper">
                                                <CustomerCard
                                                    customer={customer}
                                                    onCall={handleCall}
                                                    onCallAction={handleCallAction}
                                                    variant="urgent"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">All caught up! Great job.</p>
                                )}
                            </motion.section>
                        )}

                        {/* --- UPCOMING TAB --- */}
                        {activeTab === 'upcoming' && (
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
                                            <CustomerCard customer={c} onCall={handleCall} onCallAction={handleCallAction} variant="normal" />
                                        </div>
                                    ))}
                                    {upcoming.length === 0 && <p className="empty-state">No upcoming follow-ups.</p>}
                                </div>
                            </motion.section>
                        )}

                        {/* --- CLOSED TAB --- */}
                        {activeTab === 'closed' && (
                            <motion.section
                                className="crm-section"
                                initial="hidden" animate="visible" variants={containerVariants}
                            >
                                <div className="section-header">
                                    <h2>✅ Closed / Done <span className="count-badge">{completed.length}</span></h2>
                                </div>
                                {completed.length > 0 ? (
                                    <div className={`crm-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                                        {completed.map(customer => (
                                            <div key={customer.id} className="crm-item-wrapper">
                                                <CustomerCard
                                                    customer={customer}
                                                    onCall={handleCall}
                                                    onCallAction={handleCallAction}
                                                    variant="completed"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">No closed deals yet.</p>
                                )}
                            </motion.section>
                        )}
                    </>
                )}
            </div>

            {/* Loading Indicator for Infinite Scroll */}
            {isFetchingMore && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--color-primary)'
                }}>
                    <div style={{
                        display: 'inline-block',
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(66, 133, 244, 0.2)',
                        borderTop: '3px solid var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Loading more customers...</p>
                </div>
            )}

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
                    activeWorkflow={activeWorkflow}
                />
            )}

            {callingCustomer && (
                <CallDispositionDialog
                    customer={callingCustomer}
                    onClose={() => setCallingCustomer(null)}
                    onSave={handleSaveCallLog}
                />
            )}

            {showProfile && (
                <ProfileDialog
                    user={JSON.parse(localStorage.getItem('user')) || { name: 'User', email: '', agencyName: '' }}
                    onClose={() => setShowProfile(false)}
                    onUpdateUser={handleUpdateUser}
                />
            )}

            {/* Settings Dialog */}
            {showSettings && (
                <SettingsDialog
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    user={currentUser}
                    onUpdate={handleUpdateUser}
                />
            )}

            {/* Profile Sidebar Menu */}
            {showProfileMenu && (
                <>
                    <div className="profile-sidebar-overlay" onClick={() => setShowProfileMenu(false)} />
                    <div className="profile-sidebar">
                        <div className="sidebar-header">
                            <h3>Menu</h3>
                            <button className="close-btn" onClick={() => setShowProfileMenu(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="sidebar-menu">
                            <button className="menu-item" onClick={() => {
                                setShowProfileMenu(false);
                                setShowProfile(true);
                            }}>
                                <FaUserCog />
                                Profile Settings
                            </button>

                            <button className="menu-item" onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/my-customers');
                            }}>
                                <FaList />
                                My Customers
                            </button>

                            <button className="menu-item" onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/workflow');
                            }}>
                                <FaTasks />
                                Work Flow
                            </button>

                            <button className="menu-item" onClick={() => {
                                setShowProfileMenu(false);
                                setShowTemplates(true);
                            }}>
                                <FaWhatsapp style={{ color: '#25D366' }} />
                                Message Templates
                            </button>

                            <button className="menu-item" onClick={() => {
                                setShowProfileMenu(false);
                                setShowSettings(true);
                            }}>
                                <FaCog />
                                Settings
                            </button>

                            <div className="menu-divider"></div>

                            <button className="menu-item logout" onClick={handleLogout}>
                                <FaSignOutAlt />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Template Manager Dialog */}
            {showTemplates && (
                <TemplateManagerDialog
                    isOpen={showTemplates}
                    onClose={() => setShowTemplates(false)}
                />
            )}
        </div>
    );
};

export default Home;
