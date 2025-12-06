import { useConnect } from 'wagmi';

import { useWallet } from '../hooks/useWallet';


function ConnectMenu() {
    const { isConnected, address } = useWallet();
    const { connect, connectors } = useConnect();

    console.log("address: ", address);
    if (!isConnected) {
        return (
            <div className="connect-overlay">
                <button
                    className='connect-btn'
                    type="button"
                    onClick={() => connect({ connector: connectors[0] })}
                    >
                    Connect Wallet
                </button>
            </div>
        );
    }
}

export default ConnectMenu;