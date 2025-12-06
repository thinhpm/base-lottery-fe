import { useAccount } from 'wagmi';

export function useWallet() {
    const { isConnected, address } = useAccount();
    return { isConnected, address };
}