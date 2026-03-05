import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // On récupère le token de l'URL
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas !");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/reset-password', {
                token: token,           // Doit correspondre au schéma Python
                new_password: password  // Doit correspondre au schéma Python
            });
            setMessage(response.data.message);
            // Redirection vers le login après 3 secondes
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Le lien est invalide ou a expiré.");
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h2>Nouveau Secret</h2>
            <p>Saisis ton nouveau mot de passe pour ton grimoire.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="password" 
                    placeholder="Nouveau mot de passe" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d4af37' }}
                />
                <input 
                    type="password" 
                    placeholder="Confirmer le mot de passe" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #d4af37' }}
                />
                <button type="submit" style={{ backgroundColor: '#8d6e63', color: 'white', padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '5px' }}>
                    Enregistrer le mot de passe
                </button>
            </form>

            {message && <p style={{ color: 'green', marginTop: '20px' }}>{message} Redirection...</p>}
            {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
        </div>
    );
};

export default ResetPassword;