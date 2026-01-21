
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import '../styles/MyCustomers.css';

const MyCustomers = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser ? storedUser._id : null;
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        if (!userId) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get(`http://localhost:5000/api/customers/${userId}`);
            setCustomers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await axios.delete(`http://localhost:5000/api/customers/${id}`);
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

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                {loading ? (
                    <div className="loading">Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="no-customers">
                        <p>No customers found.</p>
                        <button className="add-btn" onClick={() => navigate('/add-customer')}>Add New Customer</button>
                    </div>
                ) : (
                    filteredCustomers.map(customer => (
                        <div key={customer._id} className="customer-list-item">
                            <div className="customer-info">
                                <div className="customer-avatar">
                                    <img
                                        src={customer.profilePicUrl || "https://via.placeholder.com/50"}
                                        alt={customer.name}
                                    />
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
                    ))
                )}
            </div>
        </div>
    );
};

export default MyCustomers;
