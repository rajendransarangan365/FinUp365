import React, { useState } from 'react';
import CustomerCard from '../components/CustomerCard';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

import api from '../services/api';
import StatusUpdateDialog from '../components/StatusUpdateDialog';

const Home = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null); // For Dialog

    React.useEffect(() => {
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
        // In this photo UI, tapping opens the dialog immediately for actions + call
        setSelectedCustomer(customer);
    };

    const handleUpdateStatus = async (customerId, updateData) => {
        try {
            // Determine status based on updateData.status (which now comes directly from dialog)
            // If it's RESCHEDULE, we treat it as 'NORMAL' active status for now, or keep user's 'RESCHEDULE' intent?
            // The Dialog passes: 'RESCHEDULE', 'CONVERTED', 'NOT_INTERESTED'

            let newStatus = updateData.status;
            // Map RESCHEDULE to 'NORMAL' or keep as is? 
            // Original logic used 'DONE' or 'NORMAL'. 
            // Let's assume 'CONVERTED' and 'NOT_INTERESTED' are effectively 'DONE' types, but we save the string.
            if (newStatus === 'RESCHEDULE') newStatus = 'NORMAL';

            await api.patch(`/customers/${customerId}/status`, {
                status: newStatus,
                followUpDate: updateData.nextDate
            });

            // Optimistic Update
            setCustomers(prev => prev.map(c =>
                c.id === customerId
                    ? { ...c, status: newStatus, followUpDate: updateData.nextDate }
                    : c
            ));
        } catch (e) {
            console.error(e);
            alert("Update failed");
        }
    };

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
                    <h1 className="brand-title">Fin FollowUp</h1>
                    <p className="crm-subtitle">Good evening, Raja</p>
                </div>
                <div className="header-actions">
                    <button className="crm-icon-btn"><FaSearch /></button>
                    <button className="crm-icon-btn profile-btn">R</button>
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
                        <div className="crm-list">
                            {actionNeeded.map(c => (
                                <CustomerCard key={c.id} customer={c} onCall={handleCall} variant="urgent" />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-card">
                            <p>All caught up! 🎉</p>
                        </div>
                    )}
                </section>

                {/* Section 2: Pipeline (Blue/Clean Theme) */}
                <section className="crm-section">
                    <div className="section-header">
                        <h2>📅 Upcoming</h2>
                    </div>
                    <div className="crm-list">
                        {upcoming.map(c => (
                            <CustomerCard key={c.id} customer={c} onCall={handleCall} variant="normal" />
                        ))}
                        {upcoming.length === 0 && <p className="text-muted">No upcoming follow-ups.</p>}
                    </div>
                </section>

                {/* Section 3: History (Muted) */}
                {completed.length > 0 && (
                    <section className="crm-section">
                        <div className="section-header">
                            <h2>📜 History</h2>
                        </div>
                        <div className="crm-list">
                            {completed.map(c => (
                                <CustomerCard key={c.id} customer={c} onCall={handleCall} variant="completed" />
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
        </div>
    );
};

export default Home;
