import React, {useEffect, useState} from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { formatEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';

import type{Profile} from '../types';
import {log} from '../hooks/helper';

import { BaseLotteryABI } from '../cryptophy/BaseLotteryABI';
import {contractAddress} from '../cryptophy/ContractAddress';
import { useWallet } from "../hooks/useWallet";
import AboutPage from "./AboutPage";
import LeaderBoardPage from './LeaderBoardPage';
import UserHistoryPage from './UserHistoryPage';


interface Ticket {
    day: number,
    number: number
}

type DayInfosTuple = [
    bigint,  // pot
    bigint,  // eco
    boolean, // drawn
    boolean, // paid
    number,  // winningNumber
    boolean, // prizeClaimed
    bigint,  // drawTimestamp
    boolean  // hasWinner
];


// interface DayInfos {
//     pot: bigint,
//     eco: bigint,
//     drawn: boolean,
//     paid: boolean,
//     winningNumber: number,
//     prizeClaimed: boolean,
//     drawTimestamp: string,
//     hasWinner: boolean
// }


interface HomePageProps {
    setCurrentPage: Dispatch<SetStateAction<string>>;
    profile: Profile | null;
    isAuthenticated: boolean;
}

const HomePage: React.FC<HomePageProps> = ({
    setCurrentPage,
    profile,
    isAuthenticated
}) => {
    const { address } = useWallet();
    const [isLoading, setIsLoading] = useState<boolean>(false); // ← NEW
    const [tickets, setTickets] = useState<number>(1);
    const [luckyTicket, setLuckyTicket] = useState<number>();
    const [myTicketsToday, setMyTicketsToday] = useState<number[]>();
    const [boughtTickets, setBoughtTickets] = useState<bigint>();
    const [currentTab, setCurrentTab] = useState('home');

    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { writeContractAsync} = useWriteContract();
    const { data: receipt, isLoading: receiptLoading } = useWaitForTransactionReceipt({
        hash: txHash,
    });
    
    const { data: currentDay } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "currentDay",
    });

    const { data: oldDayInfos} = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "dayInfos",
        args: currentDay ? [Number(currentDay) - 1] : undefined,
    }) as { data: DayInfosTuple };

    const { data: todayPot, refetch: refetchTodayPot} = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getDayPot",
        args: currentDay ? [currentDay] : undefined,
        query: {
            refetchInterval: 60000,
        },
    });

    const { data: ticketPrice } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getRequiredETH",
        query: {
            refetchInterval: 121000,
        },
    });

    const { data: totalTicketsToday, refetch: refetchTotalTicketsToday } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getTotalTicketsToday",
        query: {
            refetchInterval: 60000,
        },
    });

    const { data: myTickets, refetch: refetchUserTickets } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getUserTickets",
        args: address ? [address] : undefined,
        query: {
            refetchInterval: 31000,
        },
    });

    function formatTicket(ticket: number | string): string {
        if (ticket === "" || ticket === 0 || ticket === "0" || ticket == null) {
            return "";
        }
        return String(ticket).padStart(5, "0");
    }

    useEffect(() => {
        if (!oldDayInfos || !currentDay) return;
        setLuckyTicket(oldDayInfos[4]);
        
    }, [currentDay, oldDayInfos]);

    useEffect(() => {
        if (myTickets && currentDay) {
            let tickets = myTickets as Ticket[];
            log("MyTickets:",tickets);

            let data = [];
            let day = currentDay as number;
            for (let i=0; i < tickets.length; i++) {
                if (tickets[i].day == day) {
                    data.push(tickets[i].number);
                }
            }
            setMyTicketsToday(data);
        }

    }, [currentDay, myTickets])

    useEffect(() => {
        if (!isAuthenticated || !profile) {
            log('HomePage setup incomplete: authentication or profile missing', {
                isAuthenticated,
                profile: !!profile,
            });
            // setIsLoading(true);
            return;
        }
        
        log('HomePage setup completed', {
            isAuthenticated,
            profile: !!profile,
        });
        setIsLoading(false);
    }, [profile, setCurrentPage]);

    useEffect(() => {
        if (!receipt || !txHash) return;

        // Safely share
        // shareBoughtTickets(boughtTickets);

        // Refresh stats
        refetchTodayPot();
        refetchUserTickets();
        refetchTotalTicketsToday();
        log("receipt:", receipt)
        log("txHash:", txHash);
        log("todaypot", todayPot);
        log("myTicketstoday", myTicketsToday);
        log("totalTicketstoday:", totalTicketsToday);
        setCurrentPage("home");

    }, [receipt]);

    useEffect(() => {
        if (receiptLoading && txHash) {
            setStatusMsg("Waiting for Confirmation...");
        }

        if (receipt && txHash) {
            setStatusMsg("Success! Buy more?");
            setIsLoading(false);
        }
    }, [receiptLoading, receipt]);


    async function payAndSpin() {
        if (!ticketPrice || tickets <= 0) {
            log("Invalid tickets");
            return;
        }

        try {
            // Calculate ETH to send
            const totalValue = ticketPrice as bigint * BigInt(tickets);

            log("Paying:", {
                tickets,
                ticketPrice: ticketPrice.toString(),
                totalValue: totalValue.toString(),
            });

            const txHash = await writeContractAsync({
                address: contractAddress,
                abi: BaseLotteryABI,
                functionName: "buyTickets",
                args: [BigInt(tickets)],
                value: totalValue,
            });
            
            setTxHash(txHash);
            setStatusMsg("Sending Transaction...");
            setBoughtTickets(BigInt(tickets));

            log('Pay & Spin pressed', { tickets });
        } catch (err) {
            log('Pay & Spin failed:', err);
            setStatusMsg("Pay & Spin");
        }
    }

    async function shareBoughtTickets() {
        let totalValue;
        let ticketsCurrent;

        if (!boughtTickets) {
            totalValue = 0;
            ticketsCurrent = myTicketsToday ? myTicketsToday.length : 0;
        } else {
            totalValue = ticketPrice as bigint * BigInt(boughtTickets as bigint);
            ticketsCurrent = tickets;
        }
        
        let total = Number(formatEther(todayPot as bigint + BigInt(totalValue)));
        log("prize:", total);
        

        try {
            // Build the pre-filled message (Markdown-friendly for casts)
            const message = `I just bought ${ticketsCurrent} tickets for a chance to win ${Number(total).toFixed(6)} ETH. Try your luck? Let's play! `;
            
            // Canonical Mini App URL (strips query params for clean embed)
            const embeds: [string] = ["https://baselottery.thinhpm.homes"];
            await sdk.actions.composeCast({text: message, embeds: embeds})
        } catch (err) {
            console.error('Failed to open compose:', err);
        }
    }

    return (
        <>
        {isLoading && (
            <div className="fullscreen-loader">
                <div className="loader-content">
                    <div className="spinner" />
                    <p className="loader-text">Please wait...</p>
                </div>
            </div>
        )}
        <div className="homepage-warrap">
            <div className='homepage-card'>
                <h2 className='homepage-card-header'>Base Lottery</h2>
                <img className="avatar" src={profile?.profile_image} />
            </div>
            {currentTab === "home" && (
                <>
                <div className='homepage-card'>
                    <div className="card">
                        <h3>Lottery Stats</h3>
                        <div>
                            <div><strong>Today prize:</strong> {todayPot ? Number(formatEther(todayPot as bigint)).toFixed(6): "0"} ETH</div>
                        </div>
                        <div>
                            <div><strong>Ticket price:</strong> $0.1 ({ticketPrice ? Number(formatEther(ticketPrice as bigint)).toFixed(6) : "0"} ETH)</div>
                        </div>
                        <div>
                            <div><strong>Last lucky ticket number:</strong> {luckyTicket?.toString()}</div>
                        </div>
                        <div>
                            <div><strong>Total tickets (today):</strong> {totalTicketsToday?.toString()}</div>
                        </div>
                        <div>
                            <div>
                                <strong>Your tickets (today):</strong> 
                                {myTicketsToday && myTicketsToday?.toString().length > 0 && (
                                    <div className="tickets-list">{myTicketsToday
                                        ?.toString()
                                        .split(",")
                                        .map((item, i) => (
                                            <span key={i} className="ticket-badge">
                                                {formatTicket(item.trim())}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="homepage-card">
                    <div className='card'>
                        <h3 className='homepage-card-header'>Try your luck?</h3>
                        <div>
                            <strong>Tickes:</strong>
                            <input type='number' min={1} value={tickets} onChange={(e) => setTickets(Number(e.target.value))}></input>
                        </div>
                        <button className="btn-check" onClick={payAndSpin}>{statusMsg ? statusMsg: "Pay & Spin"}</button>
                        <button className="btn-share" onClick={shareBoughtTickets}>Share</button>
                    </div>
                </div>
                </>
            )}

            {currentTab === "history" && (
                <UserHistoryPage address={address}/>
            )}

            {currentTab === "about" && (
                <AboutPage />
            )}

            {currentTab === "leaderboard" && (
                <LeaderBoardPage/>
            )}
            <div className="bottom-nav">
                <button 
                    className={currentTab === 'home' ? 'active' : ''} 
                    onClick={() => setCurrentTab('home')}
                >
                    Home
                </button>

                <button 
                    className={currentTab === 'history' ? 'active' : ''} 
                    onClick={() => setCurrentTab('history')}
                >
                    History
                </button>

                <button
                    className={currentTab === 'leaderboard' ? 'active' : ''}
                    onClick={() => setCurrentTab('leaderboard')}
                >
                    Rank
                </button>

                <button
                    className={currentTab === 'about' ? 'active' : ''}
                    onClick={() => setCurrentTab('about')}
                >
                    How
                </button>
            </div>
        </div>
        </>
    );
};

export default HomePage;