import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Profile = () => {
    const [profile, setProfile] = useState({ name: '', email: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            const { data } = await api.get('/profile', {
                headers: { Authorization: token },
            });
            setProfile(data);
        };

        fetchProfile();
    }, []);

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        await api.put('/profile', profile, { headers: { Authorization: token } });
        alert('Profile updated successfully!');
    };

    return (
        <div className="profile-container">
            <h2>Profile</h2>
            <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Name"
            />
            <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Email"
            />
            <button onClick={handleUpdate}>Update Profile</button>
        </div>
    );
};

export default Profile;
