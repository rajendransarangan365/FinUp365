
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import '../styles/MyCustomers.css';

const MyCustomers = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser ? storedUser._id : null;
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    useEffect(() => {
        fetchCustomers(1, false);
    }, []);

    // Infinite scroll effect
    useEffect(() => {
        if (searchTerm) return; // Disable infinite scroll when searching

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollHeight - scrollTop - clientHeight < 300) {
                if (hasMore && !isFetchingMore && !loading) {
                    fetchCustomers(page + 1, true);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetchingMore, loading, page, searchTerm]);

    const fetchCustomers = async (pageNum = 1, append = false) => {
        if (!userId) {
            navigate('/login');
            return;
        }

        try {
            if (append) {
                setIsFetchingMore(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(`/customers/${userId}?page=${pageNum}&limit=10`);

            // Handle both old format (array) and new format (object with customers)
            let customersData = [];
            let paginationData = { hasMore: false };

            if (Array.isArray(response.data)) {
                customersData = response.data;
                paginationData.hasMore = false;
            } else if (response.data && response.data.customers) {
                customersData = response.data.customers;
                paginationData = response.data.pagination || {};
            }

            if (append) {
                setCustomers(prev => [...prev, ...customersData]);
            } else {
                setCustomers(customersData);
            }

            setHasMore(paginationData.hasMore || false);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/customers/${id}`);
                setCustomers(customers.filter(c => c._id !== id));
            } catch (error) {
                console.error("Error deleting customer:", error);
                alert("Failed to delete customer.");
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/edit-customer/${id}`);
    };

    // Helper to get random color for avatar
    const getRandomColor = (name) => {
        const colors = ['#a29bfe', '#ffeaa7', '#55efc4', '#81ecec', '#74b9ff', '#fab1a0'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredCustomers = searchTerm
        ? customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : customers;

    return (
        <div className="my-customers-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>My Customers</h1>
            </header>

            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="customers-list">
                {loading && customers.length === 0 ? (
                    <div className="loading">Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="no-customers">
                        <p>No customers found.</p>
                        <button className="add-btn" onClick={() => navigate('/add-customer')}>Add New Customer</button>
                    </div>
                ) : (
                    <>
                        {filteredCustomers.map(customer => (
                            <div key={customer._id} className="customer-list-item">
                                <div className="customer-info">
                                    <div className="customer-avatar">
                                        {customer.profilePicUrl ? (
                                            <img
                                                src={customer.profilePicUrl}
                                                alt={customer.name}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="avatar-placeholder"
                                            style={{
                                                background: getRandomColor(customer.name || 'User'),
                                                display: customer.profilePicUrl ? 'none' : 'flex'
                                            }}
                                        >
                                            {(customer.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="customer-details">
                                        <h3>{customer.name}</h3>
                                        <p className="customer-phone">{customer.phone}</p>
                                        <span className={`status-badge ${customer.status?.toLowerCase() || 'new'}`}>
                                            {customer.status || 'NEW'}
                                        </span>
                                    </div>
                                </div>
                                <div className="customer-actions">
                                    <button className="icon-btn edit-btn" onClick={() => handleEdit(customer._id)}>
                                        <FaEdit />
                                    </button>
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(customer._id, customer.name)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator for Infinite Scroll */}
                        {isFetchingMore && !searchTerm && (
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
                    </>
                )}
            </div>
        </div>
    );
};

export default MyCustomers;
