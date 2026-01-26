import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaSave, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import { FiImage, FiUser, FiCreditCard } from 'react-icons/fi';
import api from '../services/api';
import '../styles/AddCustomer.css';

import ImageCropper from '../components/ImageCropper';
import LocationPicker from '../components/LocationPicker';

const AddCustomer = () => {
    const navigate = useNavigate();
    const { id } = useParams();
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
    const [croppingInProgress, setCroppingInProgress] = useState(false);

    // Location Picker State
    const [coordinates, setCoordinates] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [status, setStatus] = useState('NEW'); // Default status

    // Fetch active workflow to set default status
    React.useEffect(() => {
        const fetchWorkflow = async () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser && storedUser.activeWorkflowId) {
                try {
                    const { data } = await api.get(`/workflows/${storedUser._id || storedUser.id}`);
                    const active = data.find(w => w._id === storedUser.activeWorkflowId || w._id == storedUser.activeWorkflowId);
                    if (active && active.steps.length > 0) {
                        setStatus(active.steps[0]);
                    }
                } catch (e) {
                    console.error("Failed to fetch active workflow", e);
                }
            }
        };
        if (!id) fetchWorkflow(); // Only for new customers
    }, [id]);

    // Fetch data if editing
    React.useEffect(() => {
        if (id) {
            const fetchCustomer = async () => {
                try {
                    const { data } = await api.get(`/customers/details/${id}`);
                    if (data) {
                        setName(data.name);
                        setCustomerName(data.customerName || '');
                        setPhone(data.phone);
                        setAddress(data.address || '');
                        setCoordinates(data.coordinates || null);
                        setLoanType(data.loanType || 'Business');
                        setPreviewUrl(data.photoUrl || null);
                        setProfilePreview(data.profilePicUrl || null);
                        // Ensure status is set if available
                        if (data.status) setStatus(data.status);
                    }
                } catch (err) {
                    console.warn("Failed to fetch customer using details endpoint, trying fallback list method...", err);

                    // Fallback: Fetch all customers and filter (Works if server wasn't restarted)
                    try {
                        const storedUser = JSON.parse(localStorage.getItem('user'));
                        if (!storedUser) return;

                        const { data } = await api.get(`/customers/${storedUser._id || storedUser.id}?limit=1000`); // Increase limit for finding
                        // api.get returns { customers: [], pagination: {} } based on my reading of customers.js
                        // But wait, the list endpoint returns { customers: [...] } or just [...]?
                        // Re-checking customers.js: res.json({ customers, pagination: ... })

                        const list = data.customers || data; // Handle both structures just in case
                        const found = Array.isArray(list) ? list.find(c => c._id === id) : null;

                        if (found) {
                            setName(found.name);
                            setCustomerName(found.customerName || '');
                            setPhone(found.phone);
                            setAddress(found.address || '');
                            setCoordinates(found.coordinates || null);
                            setLoanType(found.loanType || 'Business');
                            setPreviewUrl(found.photoUrl || null);
                            setProfilePreview(found.profilePicUrl || null);
                            if (found.status) setStatus(found.status);
                        } else {
                            alert("Customer not found.");
                        }
                    } catch (fallbackErr) {
                        console.error("Fallback fetch failed", fallbackErr);
                        alert("Failed to load customer details. Please restart the server.");
                    }
                }
            };
            fetchCustomer();
        }
    }, [id]);

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
        setCroppingInProgress(true);
        try {
            console.log('🖼️ Crop complete for:', croppingTarget);
            console.log('📦 Cropped blob:', croppedBlob);

            if (croppingTarget === 'business') {
                // Revoke old blob URL to free memory
                if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
                const newBlobUrl = URL.createObjectURL(croppedBlob);
                console.log('✅ New business card preview URL:', newBlobUrl);
                setPhoto(croppedBlob);
                setPreviewUrl(newBlobUrl);
            } else if (croppingTarget === 'profile') {
                // Revoke old blob URL to free memory
                if (profilePreview && profilePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(profilePreview);
                }
                const newBlobUrl = URL.createObjectURL(croppedBlob);
                console.log('✅ New profile preview URL:', newBlobUrl);
                setProfilePic(croppedBlob);
                setProfilePreview(newBlobUrl);
            }
            setCropperOpen(false);
            setCropperImage(null);
        } finally {
            setCroppingInProgress(false);
        }
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

    // Separate Upload Handlers
    const handleUploadPhoto = async () => {
        if (!photo || !id) {
            alert("Please select a business card image first");
            return;
        }

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            // IMPORTANT: Include filename for multer to recognize it as a file
            formData.append('photo', photo, 'business_card.jpg');

            console.log('☁️ Uploading business card to Cloudinary...');
            const response = await api.post(`/customers/${id}/upload-photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update preview with Cloudinary URL
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(response.data.photoUrl);
            setPhoto(null); // Clear blob since it's now uploaded

            console.log('✅ Business card uploaded:', response.data.photoUrl);
            alert("Business card uploaded to cloud! ✅");
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed: " + (error.response?.data?.error || error.message));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleUploadProfile = async () => {
        if (!profilePic || !id) {
            alert("Please select a profile picture first");
            return;
        }

        setUploadingProfile(true);
        try {
            const formData = new FormData();
            // IMPORTANT: Include filename for multer to recognize it as a file
            formData.append('profilePic', profilePic, 'profile_picture.jpg');

            console.log('☁️ Uploading profile picture to Cloudinary...');
            const response = await api.post(`/customers/${id}/upload-profile`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update preview with Cloudinary URL
            if (profilePreview && profilePreview.startsWith('blob:')) {
                URL.revokeObjectURL(profilePreview);
            }
            setProfilePreview(response.data.profilePicUrl);
            setProfilePic(null); // Clear blob since it's now uploaded

            console.log('✅ Profile picture uploaded:', response.data.profilePicUrl);
            alert("Profile picture uploaded to cloud! ✅");
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed: " + (error.response?.data?.error || error.message));
        } finally {
            setUploadingProfile(false);
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
        // Set individual upload states if images are being uploaded
        if (photo) setUploadingPhoto(true);
        if (profilePic) setUploadingProfile(true);

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
            if (!id && status) formData.append('status', status); // Send correct default status on create

            if (photo) formData.append('photo', photo);
            if (profilePic) formData.append('profilePic', profilePic);
            if (audioBlob) formData.append('audio', audioBlob, 'voice_note.webm');

            // Debug: Log what we're sending
            console.log('📤 Form submission data:');
            console.log('- Photo blob:', photo);
            console.log('- Profile pic blob:', profilePic);
            console.log('- Preview URL:', previewUrl);
            console.log('- Profile Preview URL:', profilePreview);

            let response;
            if (id) {
                // Update
                console.log('Updating customer with ID:', id);
                console.log('Request URL:', `/customers/${id}`);
                response = await api.put(`/customers/${id}`, formData);

                // Update previews with new URLs from response
                if (response.data.photoUrl && photo) {
                    // Revoke old blob URL
                    if (previewUrl && previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(response.data.photoUrl);
                    setPhoto(null); // Clear blob since it's now uploaded
                }

                if (response.data.profilePicUrl && profilePic) {
                    // Revoke old blob URL
                    if (profilePreview && profilePreview.startsWith('blob:')) {
                        URL.revokeObjectURL(profilePreview);
                    }
                    setProfilePreview(response.data.profilePicUrl);
                    setProfilePic(null); // Clear blob since it's now uploaded
                }

                alert("Customer Updated Successfully!");
                navigate('/my-customers');
            } else {
                // Create
                response = await api.post('/customers', formData);
                alert("Customer Saved Successfully!");
                navigate('/');
            }
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Error saving: " + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
            setUploadingPhoto(false);
            setUploadingProfile(false);
        }
    };

    return (
        <div className="add-lead-screen">
            <header className="add-lead-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>{id ? 'Edit Customer' : 'Add New Lead'}</h1>
            </header>

            <form onSubmit={handleSubmit} className="add-lead-form">

                {/* 1. Hero Business Card Capture */}
                <div className="photo-hero-section">
                    {previewUrl ? (
                        <div className="preview-container" onClick={() => businessInputRef.current.click()} style={{ cursor: 'pointer', position: 'relative' }}>
                            <img src={previewUrl} alt="Preview" className="hero-preview" />
                            <div className="edit-overlay"><FaCamera /> Change Card</div>
                            {croppingInProgress && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    Processing...
                                </div>
                            )}
                            {uploadingPhoto && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(67, 24, 255, 0.85)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    gap: '12px',
                                    zIndex: 10
                                }}>
                                    <div className="spinner" style={{
                                        width: '32px',
                                        height: '32px',
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        borderTop: '3px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    <div>Uploading to cloud...</div>
                                </div>
                            )}
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

                    {/* Upload Button - Only show if new image selected and editing */}
                    {id && photo && (
                        <button
                            type="button"
                            onClick={handleUploadPhoto}
                            disabled={uploadingPhoto}
                            style={{
                                width: '90%',
                                marginTop: '12px',
                                padding: '12px',
                                background: uploadingPhoto ? 'rgba(255,255,255,0.5)' : 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                                boxShadow: uploadingPhoto ? 'none' : '0 4px 15px rgba(46, 134, 222, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {uploadingPhoto ? (
                                <>
                                    <div className="spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    Uploading to Cloud...
                                </>
                            ) : (
                                <>☁️ Upload Business Card to Cloud</>
                            )}
                        </button>
                    )}
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
                                {croppingInProgress && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        borderRadius: '50%'
                                    }}>
                                        Processing...
                                    </div>
                                )}
                                {uploadingProfile && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(67, 24, 255, 0.85)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        gap: '8px',
                                        borderRadius: '50%',
                                        zIndex: 10
                                    }}>
                                        <div className="spinner" style={{
                                            width: '24px',
                                            height: '24px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }}></div>
                                        <div>Uploading...</div>
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

                    {/* Upload Button - Only show if new profile pic selected and editing */}
                    {id && profilePic && (
                        <button
                            type="button"
                            onClick={handleUploadProfile}
                            disabled={uploadingProfile}
                            style={{
                                width: '100%',
                                marginBottom: '20px',
                                padding: '12px',
                                background: uploadingProfile ? '#ccc' : 'linear-gradient(135deg, #39C0ED 0%, #2E86DE 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: uploadingProfile ? 'not-allowed' : 'pointer',
                                boxShadow: uploadingProfile ? 'none' : '0 4px 15px rgba(46, 134, 222, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {uploadingProfile ? (
                                <>
                                    <div className="spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                    Uploading to Cloud...
                                </>
                            ) : (
                                <>☁️ Upload Profile Picture to Cloud</>
                            )}
                        </button>
                    )}

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
                        <FaSave /> {uploading ? (id ? 'Updating...' : 'Creating Lead...') : (id ? 'Update Customer' : 'Save Lead')}
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
