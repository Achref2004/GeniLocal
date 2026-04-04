import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Globe, Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface User {
  username: string;
  email: string;
  region?: string;
  institution?: string;
}

interface Stats {
  total_users: number;
  by_region: Record<string, number>;
  by_institution: Record<string, number>;
}

export function StatisticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total_users: 0, by_region: {}, by_institution: {} });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erreur de récupération des données", error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour les graphiques
  const regionData = Object.entries(stats.by_region).map(([region, count]) => ({
    name: region,
    count: count as number
  }));

  const institutionData = Object.entries(stats.by_institution).map(([institution, count]) => ({
    name: institution,
    count: count as number
  }));

  const COLORS = ['#8a9a8f', '#cdaa6a', '#4ade80', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
        <p className="text-[#8a9a8f] text-lg">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] p-6">
      {/* Bouton retour */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-[#8a9a8f] hover:text-[#3a3f3b] mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Retour à l'Administration
      </motion.button>

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-serif text-4xl text-[#3a3f3b] mb-2">Statistiques des Utilisateurs</h1>
        <p className="text-[#8a9a8f]">Analyse détaillée par région et université</p>
      </motion.div>

      {/* Cartes Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-[#8a9a8f] w-6 h-6" />
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Total Utilisateurs</p>
          </div>
          <p className="text-4xl font-serif text-[#3a3f3b]">{stats.total_users}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <Globe className="text-[#cdaa6a] w-6 h-6" />
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Régions</p>
          </div>
          <p className="text-4xl font-serif text-[#cdaa6a]">{Object.keys(stats.by_region).length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="text-[#4ade80] w-6 h-6" />
            <p className="text-[#8a9a8f] text-sm uppercase font-bold">Universités</p>
          </div>
          <p className="text-4xl font-serif text-[#4ade80]">{Object.keys(stats.by_institution).length}</p>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {/* Graphique Utilisateurs par Région */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <h2 className="font-serif text-2xl text-[#3a3f3b] mb-6">Utilisateurs par Région</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1cab5" />
              <XAxis dataKey="name" stroke="#8a9a8f" />
              <YAxis stroke="#8a9a8f" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#3a3f3b',
                  border: '1px solid #8a9a8f',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cdaa6a' }}
              />
              <Bar dataKey="count" fill="#8a9a8f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Camembert Répartition par Région */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <h2 className="font-serif text-2xl text-[#3a3f3b] mb-6">Répartition par Région</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8a9a8f"
                dataKey="count"
              >
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#3a3f3b',
                  border: '1px solid #8a9a8f',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cdaa6a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Graphique Utilisateurs par Université */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <h2 className="font-serif text-2xl text-[#3a3f3b] mb-6">Utilisateurs par Université</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={institutionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#d1cab5" />
              <XAxis type="number" stroke="#8a9a8f" />
              <YAxis type="category" dataKey="name" stroke="#8a9a8f" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#3a3f3b',
                  border: '1px solid #8a9a8f',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cdaa6a' }}
              />
              <Bar dataKey="count" fill="#cdaa6a" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Camembert Répartition par Université */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 border border-[#d1cab5] shadow-md"
        >
          <h2 className="font-serif text-2xl text-[#3a3f3b] mb-6">Répartition par Université</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={institutionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${count}`}
                outerRadius={80}
                fill="#cdaa6a"
                dataKey="count"
              >
                {institutionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + institutionData.length) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#3a3f3b',
                  border: '1px solid #8a9a8f',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cdaa6a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tableau détaillé par Région */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl border border-[#d1cab5] overflow-hidden shadow-md"
      >
        <div className="p-6 border-b border-[#d1cab5]">
          <h2 className="font-serif text-2xl text-[#3a3f3b]">Détail par Région</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#eae4d3] text-[#3a3f3b]">
              <tr>
                <th className="p-4 text-left">Région</th>
                <th className="p-4 text-right">Nombre d'Utilisateurs</th>
                <th className="p-4 text-right">Pourcentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea]">
              {regionData.map((region, index) => (
                <tr key={region.name} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="p-4 font-medium text-[#3a3f3b]">{region.name}</td>
                  <td className="p-4 text-right text-[#8a9a8f] font-semibold">{region.count}</td>
                  <td className="p-4 text-right text-[#8a9a8f]">
                    {stats.total_users > 0 ? (((region.count / stats.total_users) * 100).toFixed(1)) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Tableau détaillé par Université */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl border border-[#d1cab5] overflow-hidden shadow-md mt-10"
      >
        <div className="p-6 border-b border-[#d1cab5]">
          <h2 className="font-serif text-2xl text-[#3a3f3b]">Détail par Université</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#eae4d3] text-[#3a3f3b]">
              <tr>
                <th className="p-4 text-left">Université</th>
                <th className="p-4 text-right">Nombre d'Utilisateurs</th>
                <th className="p-4 text-right">Pourcentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ea]">
              {institutionData.map((institution) => (
                <tr key={institution.name} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="p-4 font-medium text-[#3a3f3b] max-w-xs truncate" title={institution.name}>
                    {institution.name}
                  </td>
                  <td className="p-4 text-right text-[#8a9a8f] font-semibold">{institution.count}</td>
                  <td className="p-4 text-right text-[#8a9a8f]">
                    {stats.total_users > 0 ? (((institution.count / stats.total_users) * 100).toFixed(1)) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
