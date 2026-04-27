import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

/**
 * Global component that handles tracking user presence and session time seamlessly in the background.
 * It does NOT trigger React UI re-renders, preventing performance issues,
 * but keeps the backend perfectly synchronized.
 */
const GlobalSessionTracker: React.FC = () => {
    const saveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // On Mount: Check if we need to bump 'days_present'
        const today = new Date().toISOString().split('T')[0];
        const lastPresence = localStorage.getItem('last_presence_date');
        
        let increment_presence = 0;
        if (lastPresence !== today) {
            increment_presence = 1;
            localStorage.setItem('last_presence_date', today);
        }

        // Send an initial handshake to update presence + sync early
        if (increment_presence > 0) {
            axios.post(`${BACKEND_URL}/api/progression`, {
                increment_seconds: 0,
                increment_presence: increment_presence
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(console.warn);
        }

        // Set ping interval to save 5 seconds of work every 5 seconds globally
        saveTimer.current = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                axios.post(`${BACKEND_URL}/api/progression`, {
                    increment_seconds: 5,
                    increment_presence: 0
                }, {
                    headers: { Authorization: `Bearer ${currentToken}` }
                }).catch(err => {
                    console.warn('Impossible de sauvegarder le temps de session global', err);
                });
            }
        }, 5000);

        return () => {
            if (saveTimer.current) {
                clearInterval(saveTimer.current);
            }
        };
    }, []);

    return null; // Silent component
};

export default GlobalSessionTracker;
