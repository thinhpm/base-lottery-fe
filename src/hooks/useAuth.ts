import { useState, useEffect, useMemo } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import {log} from './helper'
import {BACKEND_API_URL} from '../config/env';
import type{Profile} from '../types';
import { useWallet } from './useWallet';



interface AuthState {
    profile: Profile | null;
    isAuthenticated: boolean;
}

export const useAuth = (): AuthState => {
    const [profile, setProfile] = useState< Profile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { isConnected, address  } = useWallet();

    useEffect(() => {
        log('useAuth useEffect running');

        if (!isConnected) {
            log("isConnected false");
        }

        async function getUserInfo(token: string) {
            const response = await fetch(`${BACKEND_API_URL}/user?token=${token}`);

            if (!response.ok) {
                log("get user info failed");
            }

            const data = await response.json();
            return data['data'];
        }

        async function authenticate() {
            try {
                const { token } = await sdk.quickAuth.getToken();
                const userInfo = await getUserInfo(token);
                log("User Info: ", userInfo);

                if (userInfo) {
                    setProfile({ user_id: userInfo.user_id, fid: userInfo.fid, profile_image:  userInfo.profile_image, address: address, token: token});
                    setIsAuthenticated(true);
                }
            } catch (error) {
                log("Init profile failed");
            }
        }
        authenticate();
    }, []);

    return useMemo(
        () => ({
            profile: profile ? { ...profile } : null, // Deep copy to ensure stability
            isAuthenticated,
        }),
        [profile?.user_id, profile?.profile_image, profile?.token, isAuthenticated] // Depend on primitive values
    );
};