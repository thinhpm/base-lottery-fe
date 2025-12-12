import React from 'react';
import {contractAddress} from '../cryptophy/ContractAddress';



interface AboutPageProps {
}

const AboutPage: React.FC<AboutPageProps> = ({}) => {
    return (
        <>
        <div className="homepage-card">
            <div className='card'>
                <h3 className='homepage-card-header'>How it works</h3>
                <div>
                    <h4>Base Lottery is a transparent, on-chain daily lottery where every ticket has an equal chance to win.
No VC. No rug. 100% verifiable on the blockchain.</h4>
                </div>
                <div className='card-body'>
                    <h4>1. Daily Pot Distribution</h4>
                    <div className='card-item'>
                        <p>Every day, the total pot is split automatically:</p>
                        <p>- 90% → Prize Pool for winners</p>
                        <p>- 5% → Rollover added to tomorrow's pot</p>
                        <p>- 5% → Ecosystem (maintenance + growth)</p>
                        <p>The math is fixed in the contract — no one can change it.</p>
                    </div>
                </div>
                <div className='card-body'>
                    <h4>2. Buy Tickets</h4>
                    <div className='card-item'>
                        <p>- Each ticket costs $0.10 USD (converted to ETH at real-time price).</p>
                        <p>- You can buy unlimited tickets per day.</p>
                        <p>- Your ticket numbers are generated on-chain using pseudorandomness.</p>
                    </div>
                </div>
                <div className='card-body'>
                    <h4>3. Daily Draw</h4>
                    <div className='card-item'>
                        <p>- At the end of the day, the contract picks a winning number.</p>
                        <p>- If multiple players have the same number → prize is split evenly.</p>
                        <p>- If no winner, the entire pot rolls over to the next day.</p>
                    </div>
                </div>
                <div className='card-body'>
                    <h4>4. Fully On-Chain & Trustless</h4>
                    <div className='card-item'>
                        <p>- Funds stay in the contract until the system automatically pays them out.</p>
                        <p>- No centralized wallet controlling the pot.</p>
                        <p>- No hidden fees, no VC, no early investor allocation.</p>
                    </div>
                </div>
                <div className='card-body'>
                    <h4>5. 100% Transparent</h4>
                    <div className='card-item'>
                        <p>Smart contract is public and verified <a href={"https://basescan.org/address/" + contractAddress} target="_blank">here</a></p>
                    </div>
                </div>
                <div className='card-footer'>
                    <h4>Base Lottery is for Everyone</h4>
                </div>
            </div>
        </div>
        </>
    );
};
    
export default AboutPage;