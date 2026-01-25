import React, { useState } from 'react';
import { FaSearch, FaTimes, FaFilter, FaCheckCircle, FaTimesCircle, FaBell, FaClock, FaStar, FaCalendarAlt } from 'react-icons/fa';
import '../styles/FilterBar.css';

const FilterBar = ({ onFilterChange, activeFilters, totalCount, filteredCount, activeWorkflow }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    let statusFilters;

    if (activeWorkflow) {
        statusFilters = [
            { value: 'ALL', label: 'All', icon: <FaFilter /> },
            ...activeWorkflow.steps.map(step => ({
                value: step,
                label: step,
                icon: <FaCheckCircle /> // Generic icon for custom steps
            }))
        ];
    } else {
        statusFilters = [
            { value: 'ALL', label: 'All', icon: <FaFilter /> },
            { value: 'NEW', label: 'New', icon: <FaStar /> },
            { value: 'TODAY', label: 'Today', icon: <FaBell /> },
            { value: 'NORMAL', label: 'Under Process', icon: <FaClock /> },
            { value: 'CONVERTED', label: 'Converted', icon: <FaCheckCircle /> },
            { value: 'NOT_INTERESTED', label: 'Not Interested', icon: <FaTimesCircle /> }
        ];
    }

    const dateFilters = [
        { value: 'ALL', label: 'All Time' },
        { value: 'TODAY', label: 'Today' },
        { value: 'THIS_WEEK', label: 'This Week' },
        { value: 'THIS_MONTH', label: 'This Month' }
    ];

    const handleStatusFilter = (status) => {
        onFilterChange({ ...activeFilters, status });
    };

    const handleDateFilter = (dateRange) => {
        onFilterChange({ ...activeFilters, dateRange });
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onFilterChange({ ...activeFilters, search: query });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        onFilterChange({ status: 'ALL', dateRange: 'ALL', search: '' });
    };

    const hasActiveFilters = activeFilters.status !== 'ALL' ||
        activeFilters.dateRange !== 'ALL' ||
        activeFilters.search !== '';

    const activeFilterCount = [
        activeFilters.status !== 'ALL',
        activeFilters.dateRange !== 'ALL',
        activeFilters.search !== ''
    ].filter(Boolean).length;

    return (
        <div className="filter-bar">
            {/* Search Bar */}
            <div className="filter-search-container">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="filter-search-input"
                    />
                    {searchQuery && (
                        <button
                            className="clear-search-btn"
                            onClick={() => {
                                setSearchQuery('');
                                onFilterChange({ ...activeFilters, search: '' });
                            }}
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Toggle Filters Button */}
                <button
                    className={`toggle-filters-btn ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter />
                    {activeFilterCount > 0 && (
                        <span className="filter-count-badge">{activeFilterCount}</span>
                    )}
                </button>
            </div>

            {/* Filter Chips Container */}
            <div className={`filter-chips-container ${showFilters ? 'show' : 'hide'}`}>
                {/* Status Filters */}
                {statusFilters.map(filter => (
                    <button
                        key={filter.value}
                        className={`filter-chip ${activeFilters.status === filter.value ? 'active' : ''}`}
                        onClick={() => handleStatusFilter(filter.value)}
                    >
                        {filter.icon}
                        <span>{filter.label}</span>
                    </button>
                ))}

                <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 8px' }}></div>

                {/* Date Range Filters */}
                {dateFilters.map(filter => (
                    <button
                        key={filter.value}
                        className={`filter-chip ${activeFilters.dateRange === filter.value ? 'active' : ''}`}
                        onClick={() => handleDateFilter(filter.value)}
                    >
                        <FaCalendarAlt />
                        <span>{filter.label}</span>
                    </button>
                ))}

                {/* Clear All & Results Count */}
                <div className="filter-actions" style={{ marginLeft: 'auto', border: 'none', padding: 0 }}>
                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={handleClearFilters}>
                            <FaTimes />
                            <span>Clear</span>
                        </button>
                    )}
                    <div className="results-count">
                        <strong>{filteredCount}</strong> results
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
