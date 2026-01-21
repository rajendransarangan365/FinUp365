import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaSave, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import { FiImage, FiUser, FiCreditCard } from 'react-icons/fi';
import api from '../services/api';
import '../styles/AddCustomer.css';

import ImageCropper from '../components/ImageCropper';
import LocationPicker from '../components/LocationPicker';

const AddCustomer = () => {
    const navigate = useNavigate();
    const [name, setName] = useState(''); // Business Name
    const [customerName, setCustomerName] = useState(''); // New: Person Name
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState(''); // New: Address State
    const [loanType, setLoanType] = useState('Business');
    const [note, setNote] = useState('');

    const [photo, setPhoto] = useState(null); // Business Card
    const [previewUrl, setPreviewUrl] = useState(null);

    const [profilePic, setProfilePic] = useState(null); // New: Avatar
    const [profilePreview, setProfilePreview] = useState(null);

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperAspect, setCropperAspect] = useState(4 / 3);
    const [croppingTarget, setCroppingTarget] = useState(null); // 'business' or 'profile'

    // Location Picker State
    const [coordinates, setCoordinates] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    const [uploading, setUploading] = useState(false);

    // Refs
    const businessInputRef = React.useRef(null);
    const profileInputRef = React.useRef(null);

    const handleFileChange = (e, target) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropperImage(reader.result);
                setCroppingTarget(target);
                setCropperAspect(target === 'business' ? 1.586 : 1); // Business Card ratio vs Square
                setCropperOpen(true);
            });
            reader.readAsDataURL(file);
            // Reset input so same file can be selected again
            e.target.value = null;
        }
    };

    const handleCropComplete = async (croppedBlob) => {
        if (croppingTarget === 'business') {
            setPhoto(croppedBlob);
            setPreviewUrl(URL.createObjectURL(croppedBlob));
        } else if (croppingTarget === 'profile') {
            setProfilePic(croppedBlob);
            setProfilePreview(URL.createObjectURL(croppedBlob));
        }
        setCropperOpen(false);
        setCropperImage(null);
    };

    // ... Audio Recorder Logic (Kept Same) ...
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    const toggleRecording = async () => {
        if (recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                chunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                };
                mediaRecorderRef.current.start();
                setRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser._id) {
            alert("Please login again");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('userId', storedUser._id);
            formData.append('name', name);
            formData.append('customerName', customerName);
            formData.append('phone', phone);
            formData.append('address', address);
            if (coordinates) {
                formData.append('coordinates', JSON.stringify(coordinates));
            }
            formData.append('loanType', loanType);

            if (photo) formData.append('photo', photo);
            if (profilePic) formData.append('profilePic', profilePic);
            if (audioBlob) formData.append('audio', audioBlob, 'voice_note.webm');

            await api.post('/customers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Customer Saved Successfully!");
            navigate('/');
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Error saving: " + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-lead-screen">
            <header className="add-lead-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>Add New Lead</h1>
            </header>

            <form onSubmit={handleSubmit} className="add-lead-form">

                {/* 1. Hero Business Card Capture */}
                <div className="photo-hero-section">
                    {previewUrl ? (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Preview" className="hero-preview" />
                            <div className="edit-overlay"><FaCamera /> Change Card</div>
                        </div>
                    ) : (
                        <div className="hero-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
                            <div className="camera-circle">
                                <FiCreditCard size={40} />
                            </div>
                            <h3 style={{ margin: '16px 0 8px', textAlign: 'center' }}>Scan Business Card</h3>
                            <p style={{ margin: '0 0 20px', textAlign: 'center' }}>Tap to capture shop or card</p>

                            {/* Camera and Gallery Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center',
                                width: '100%',
                                maxWidth: '400px'
                            }}>
                                {/* Camera Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.capture = 'environment';
                                        input.onchange = (e) => handleFileChange(e, 'business');
                                        input.click();
                                    }}
                                    style={{
                                        background: '#FFF',
                                        border: '2px solid #4318FF',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#4318FF',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 8px rgba(67, 24, 255, 0.1)',
                                        flex: 1
                                    }}
                                >
                                    <FaCamera size={16} />
                                    Camera
                                </button>

                                {/* Gallery Button */}
                                <button
                                    type="button"
                                    onClick={() => businessInputRef.current.click()}
                                    style={{
                                        background: '#FFF',
                                        border: '2px solid #4318FF',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#4318FF',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 8px rgba(67, 24, 255, 0.1)',
                                        flex: 1
                                    }}
                                >
                                    <FiImage size={16} />
                                    Gallery
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={businessInputRef}
                        onChange={(e) => handleFileChange(e, 'business')}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                </div>

                {/* 2. Profile & Details */}
                <div className="form-card" style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>

                    {/* Profile Avatar Upload */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '-50px' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <div
                                style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    background: 'white', border: '4px solid white',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                    overflow: 'hidden', position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                {profilePreview ? (
                                    <img src={profilePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4318FF' }}>
                                        {customerName ? customerName.charAt(0).toUpperCase() : <FiUser size={32} color="#ccc" />}
                                    </div>
                                )}
                            </div>

                            {/* Camera Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.capture = 'environment';
                                    input.onchange = (e) => handleFileChange(e, 'profile');
                                    input.click();
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    background: '#FFF',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#4318FF'
                                }}
                            >
                                <FaCamera size={14} />
                            </button>

                            {/* Gallery Button */}
                            <button
                                type="button"
                                onClick={() => profileInputRef.current.click()}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    background: '#FFF',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#4318FF'
                                }}
                            >
                                <FiImage size={14} />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={profileInputRef}
                            onChange={(e) => handleFileChange(e, 'profile')}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                    </div>

                    <div className="input-group">
                        <label>Business / Lead Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rajan Traders"
                            className="clean-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Rajan"
                            className="clean-input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <div className="phone-row">
                            <span className="country-code">+91</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="98765 00000"
                                className="clean-input"
                                required
                            />
                        </div>
                    </div>


                    <div className="input-group">
                        <label>Address / Location</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. 123 Main St, New York"
                                className="clean-input"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowLocationPicker(true)}
                                style={{
                                    background: coordinates ? '#E3F2FD' : '#f5f6fa',
                                    border: coordinates ? '1px solid #2196F3' : '1px solid #dcdde1',
                                    borderRadius: '12px',
                                    padding: '0 12px',
                                    cursor: 'pointer',
                                    color: coordinates ? '#2196F3' : '#7f8c8d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Pick on Map"
                            >
                                <FaMapMarkerAlt size={18} />
                                {coordinates && <FaCheck size={12} style={{ marginLeft: '4px' }} />}
                            </button>
                        </div>
                        {coordinates && (
                            <div style={{ fontSize: '0.75rem', color: '#2196F3', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaCheck size={10} /> Location Pinned ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Category</label>
                        <div className="chip-row">
                            {['Business', 'Personal', 'Home', 'Vehicle'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`filter-chip ${loanType === type ? 'active' : ''}`}
                                    onClick={() => setLoanType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Audio / Notes */}
                <div className="form-card voice-card">
                    <div className="voice-header">
                        <label>Voice Note</label>
                        {audioBlob && <span className="audio-badge">Saved</span>}
                    </div>

                    <button type="button" className={`record-btn ${recording ? 'recording' : ''}`} onClick={toggleRecording}>
                        <FaMicrophone />
                        {recording ? 'Stop Recording' : (audioBlob ? 'Re-record Note' : 'Tap to Record Note')}
                    </button>
                </div>

                <div style={{ height: '80px' }}></div>

                <div className="sticky-footer">
                    <button type="submit" className="save-lead-btn" disabled={uploading}>
                        <FaSave /> {uploading ? 'Creating Lead...' : 'Save Lead'}
                    </button>
                </div>

            </form >

            {/* Image Cropper Modal */}
            {
                cropperOpen && (
                    <ImageCropper
                        imageSrc={cropperImage}
                        aspect={cropperAspect}
                        onCropComplete={handleCropComplete}
                        onClose={() => setCropperOpen(false)}
                    />
                )
            }

            {/* Location Picker Modal */}
            {showLocationPicker && (
                <LocationPicker
                    onClose={() => setShowLocationPicker(false)}
                    onConfirm={(coords) => {
                        setCoordinates(coords);
                        setShowLocationPicker(false);
                    }}
                />
            )}
        </div >
    );
};

export default AddCustomer;
