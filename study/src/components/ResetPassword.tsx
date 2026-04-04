import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas !");
            return;
        }

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/reset-password', {
                token: token,
                new_password: password
            });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Le lien est invalide ou a expiré.");
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
                    <div className="bg-gradient-to-b from-[#f9f7f3] to-[#f4f1ea] p-6 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                            className="relative"
                        >
                            {/* Carré décoratif */}
                            <div className="absolute inset-0 rounded-xl border-2 border-[#cdaa6a]/30" />
                            <div className="absolute inset-2 rounded-lg border border-[#8a9a8f]/20" />

                            {/* Icône cadenas */}
                            <div className="relative size-16 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-xl bg-[#8a9a8f]/5" />
                                <Lock className="w-8 h-8 text-[#2d7a5a]" strokeWidth={1.5} />
                            </div>
                        </motion.div>

                        {/* Titre */}
                        <h2 className="font-serif text-xl font-bold text-[#2d7a5a] mt-4 mb-1">
                            Nouveau mot de passe
                        </h2>

                        {/* Sous-titre */}
                        <p className="text-center text-xs text-[#8a9a8f] leading-relaxed">
                            Choisissez un mot de passe fort pour protéger votre compte.
                        </p>
                    </div>

                    {/* Formulaire */}
                    <div className="p-6">
                        {/* Messages */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-red-700 text-xs">{error}</p>
                            </motion.div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-green-700 text-xs">{message}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nouveau mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-[#2d7a5a] mb-2 tracking-wider">
                                    NOUVEAU MOT DE PASSE
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9a8f]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-10 py-2 border-2 border-[#d1cab5] rounded-lg bg-[#f9f7f3] text-[#3a3f3b] placeholder-[#b8bfb9] focus:outline-none focus:border-[#2d7a5a] focus:bg-white transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9a8f] hover:text-[#2d7a5a] transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirmer mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-[#2d7a5a] mb-2 tracking-wider">
                                    CONFIRMER LE MOT DE PASSE
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9a8f]" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-10 py-2 border-2 border-[#d1cab5] rounded-lg bg-[#f9f7f3] text-[#3a3f3b] placeholder-[#b8bfb9] focus:outline-none focus:border-[#2d7a5a] focus:bg-white transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9a8f] hover:text-[#2d7a5a] transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Bouton */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || !!message}
                                className="w-full py-2 bg-gradient-to-r from-[#a8d5ba] to-[#7fc9a3] text-[#2d7a5a] font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-[#7fc9a3] hover:to-[#56bdb8] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#2d7a5a] border-t-transparent rounded-full animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Réinitialiser
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-2 my-4">
                            <div className="flex-1 h-px bg-[#d1cab5]" />
                            <span className="text-[#cdaa6a] text-xs font-medium">ou</span>
                            <div className="flex-1 h-px bg-[#d1cab5]" />
                        </div>

                        {/* Retour mot de passe oublié */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate('/forgot-password')}
                            className="w-full flex items-center justify-center gap-2 text-[#cdaa6a] hover:text-[#b5955c] font-semibold transition-colors text-sm"
                        >
                            <span>←</span>
                            Retour — mot de passe oublié
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
