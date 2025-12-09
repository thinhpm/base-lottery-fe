import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import '../public/assets/style.css';
import { useAuth } from './hooks/useAuth';
import ConnectMenu from './components/ConnectMenu';
import HomePage from './pages/HomePage';
// import HistoryPage from './pages/HistoryPage';

import {log} from './hooks/helper'


// Initialize Farcaster SDK
const initializeFarcaster = async () => {
    try {
        sdk.actions.ready();
        await sdk.actions.addMiniApp();
        log('Farcaster miniapp initialized');
    } catch (error) {
        log('Failed to initialize Farcaster miniapp:', error);
    }
    };

    const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<string>('home');
    const { profile, isAuthenticated } = useAuth();

    // Log state changes for debugging
    useEffect(() => {
        log('App state:', {
            currentPage,
            isAuthenticated,
            profile: profile ? { profile } : null,
        });
    }, [currentPage, isAuthenticated, profile]);

    // Initialize Farcaster SDK on mount
    useEffect(() => {
        initializeFarcaster();
    }, []);

    return (
        <div>
        {/* <ConnectMenu /> */}
        {currentPage === 'home' && (
            <HomePage
            setCurrentPage={setCurrentPage}
            profile={profile}
            isAuthenticated={isAuthenticated}
            />
        )}
         {/* {currentPage === 'history' && (
            <HistoryPage
            setCurrentPage={setCurrentPage}
            profile={profile}
            isAuthenticated={isAuthenticated}
            />
        )} */}
        </div>
    );
};

export default App;