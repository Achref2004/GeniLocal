import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/forgot-password', {
        email: email
      });
      setMessage(response.data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Générer des bulles flottantes
  const Bubbles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-40"
          style={{
            width: Math.random() * 100 + 20,
            height: Math.random() * 100 + 20,
            background: ['#8a9a8f', '#cdaa6a', '#4ade80', '#f59e0b', '#a855f7'].at(
              Math.floor(Math.random() * 5)
            ),
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 100 - 50],
            x: [0, Math.random() * 100 - 50],
            scale: [1, Math.random() * 0.5 + 0.5],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8e4db] via-[#f0ede6] to-[#eae4d3] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Bulles flottantes */}
      <Bubbles />

      {/* Contenu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-[#2d7a5a]">
          {/* En-tête avec icône */}
          <div className="bg-gradient-to-b from-[#f9f7f3] to-[#f4f1ea] p-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="relative"
            >
              {/* Cercle décoratif */}
              <div className="absolute inset-0 rounded-full border-2 border-[#cdaa6a]/30" />
              <div className="absolute inset-2 rounded-full border border-[#8a9a8f]/20" />

              {/* Icône */}
              <div className="relative size-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#8a9a8f]/5" />
                <Mail className="w-10 h-10 text-[#2d7a5a]" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Titre */}
            <h2 className="font-serif text-2xl font-bold text-[#2d7a5a] mt-6 mb-2">
              Mot de passe oublié ?
            </h2>

            {/* Sous-titre */}
            <p className="text-center text-sm text-[#8a9a8f] leading-relaxed">
              Pas de panique ! Entrez votre email et nous vous enverrons un lien de récupération.
            </p>
          </div>

          {/* Formulaire */}
          <div className="p-8">
            {/* Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-700 text-sm">{message}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Champ Email */}
              <div>
                <label className="block text-xs font-bold text-[#2d7a5a] mb-3 tracking-wider">
                  ADRESSE EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a9a8f]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#d1cab5] rounded-lg bg-[#f9f7f3] text-[#3a3f3b] placeholder-[#b8bfb9] focus:outline-none focus:border-[#2d7a5a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Bouton */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#2d7a5a] to-[#1f5a42] text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-[#1f5a42] hover:to-[#164030] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer le lien de récupération
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#d1cab5]" />
              <span className="text-[#cdaa6a] text-sm font-medium">ou</span>
              <div className="flex-1 h-px bg-[#d1cab5]" />
            </div>

            {/* Retour à connexion */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-[#cdaa6a] hover:text-[#b5955c] font-semibold transition-colors"
            >
              <span>←</span>
              Retour à la connexion
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
