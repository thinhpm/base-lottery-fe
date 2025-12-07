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


interface Ticket {
    day: number,
    number: number
}


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

    const [myTicketsToday, setMyTicketsToday] = useState<number[]>();
    const [boughtTickets, setBoughtTickets] = useState<number>(0);

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

    const { data: todayPot } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getDayPot",
        args: [currentDay]
    });

    const { data: ticketPrice } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getRequiredETH",
    });

    const { data: totalTicketsToday } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getTotalTicketsToday"
    });

    const { data: myTickets } = useReadContract({
        address: contractAddress,
        abi: BaseLotteryABI,
        functionName: "getUserTickets",
        args: address ? [address] : undefined,
    });

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
        if (receiptLoading && txHash) {
            setStatusMsg("Waiting for Confirmation...");
        }

        if (receipt && txHash) {
            setStatusMsg("Spin successful!");
            setIsLoading(false);
            shareBoughtTickets(boughtTickets);
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
            setBoughtTickets(tickets);

            log('Pay & Spin pressed', { tickets });
        } catch (err) {
            log('Pay & Spin failed:', err);
            setStatusMsg("Transaction failed");
        }
    }

    async function shareBoughtTickets(tickets: Number | 1) {
        if (!tickets) {
            return
        }
        
        try {
            // Build the pre-filled message (Markdown-friendly for casts)
            const message = `I just bought ${tickets} tickets for a chance to win ${Number(formatEther(todayPot as bigint)).toFixed(6)} ETH. Try your luck? Let's play! `;
            
            // Canonical Mini App URL (strips query params for clean embed)
            const embeds: [string] = ["https://baselottery.thinhpm.homes"];
            const result = await sdk.actions.composeCast({text: message, embeds: embeds})

            console.log(result);

            
            console.log('Compose screen opened with pre-filled cast');
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
        <div className={`${isLoading ? 'hidden' : ''}`}>
            <div className='homepage-card'>
                <h2 className='homepage-card-header'>Base Lottery</h2>
                <img className="avatar" src={profile?.profile_image} />
            </div>
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
                        <div><strong>Total tickets (today):</strong> {totalTicketsToday?.toString()}</div>
                    </div>
                    <div>
                        <div><strong>Your tickets (today):</strong> {myTicketsToday?.toString()}</div>
                    </div>
                </div>
            </div>
            <div className="homepage-card">
                <h3 className='homepage-card-header'>Try your luck?</h3>
                <div className='card'>
                    <strong>Tickes:</strong>
                    <input type='number' min={1} value={tickets} onChange={(e) => setTickets(Number(e.target.value))}></input>
                </div>
                <button className="btn-check" onClick={payAndSpin}>Pay & Spin</button>
                {statusMsg && (
                    <div className="tx-message">{statusMsg}</div>
                )}
            </div>
        </div>
        </>
    );
};

export default HomePage;