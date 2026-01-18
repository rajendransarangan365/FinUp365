import React from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
import '../styles/CustomerCard.css';

const CustomerCard = ({ customer, onCall, variant = 'normal' }) => {

    // Variant styles
    const isUrgent = variant === 'urgent';
    const isCompleted = variant === 'completed';
    const isNew = variant === 'new';

    return (
        <div className={`crm-card ${isUrgent ? 'urgent-border' : ''} ${isNew ? 'new-border' : ''} ${isCompleted ? 'completed-dim' : ''}`} onClick={() => onCall(customer)}>
            <div className="crm-card-content">
                <div className="crm-avatar">
                    {customer.photoUrl ? (
                        <img src={customer.photoUrl} alt="avatar" />
                    ) : (
                        <div className="avatar-placeholder">{customer.name.charAt(0)}</div>
                    )}
                </div>

                <div className="crm-info">
                    <h3 className="crm-name">{customer.name}</h3>
                    <p className="crm-detail">{customer.agencyName}</p>
                    <div className="crm-tags">
                        <span className="crm-tag">{customer.loanType}</span>
                        {customer.followUpDate && <span className="crm-date-tag">📅 {customer.followUpDate}</span>}
                    </div>
                </div>

                <div className="crm-status-icon">
                    {customer.status === 'NEW' && <span className="status-emoji" title="New">🌟</span>}
                    {customer.status === 'CONVERTED' && <span className="status-emoji" title="Closed">🎉</span>}
                    {customer.status === 'NOT_INTERESTED' && <span className="status-emoji" title="Not Interested">❌</span>}
                    {isUrgent && <div className="indicator-dot"></div>}
                </div>
            </div>
        </div>
    );
};

export default CustomerCard;
