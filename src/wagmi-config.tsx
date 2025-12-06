import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains'; // Use the chain your contract is on
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
    chains: [base], // Replace with your chain (e.g., mainnet, sepolia, etc.)
    transports: {
        [base.id]: http(),
    },
    connectors: [
        miniAppConnector(),
    ],
});