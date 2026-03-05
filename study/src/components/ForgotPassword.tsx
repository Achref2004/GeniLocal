import React, { useState } from 'react';
import axios from 'axios'; // Assure-toi d'avoir installé axios : npm install axios

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // On appelle la route que tu viens de créer dans le Backend
      const response = await axios.post('http://localhost:8000/forgot-password', {
        email: email
      });

      // Si ça marche, on affiche le message de succès
      setMessage(response.data.message);
    } catch (err: any) {
      // Si le backend renvoie une erreur (ex: compte Google)
      setError(err.response?.data?.detail || "Une erreur est survenue.");
    }
  };

  return (
    <div style={{ /* Ton style parchemin */ }}>
      <h2>Récupération de compte</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Ton grimoire (Email)" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
        <button type="submit">Envoyer le lien</button>
      </form>

      {/* Affichage des messages à l'utilisateur */}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;