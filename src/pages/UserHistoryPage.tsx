import React, { useEffect, useState } from "react";
import { BACKEND_API_URL } from "../config/env";
import { log } from "../hooks/helper";

interface Winner {
    username: string;
    pfp_url?: string;
    address: string;
}

interface UserHistoryItem {
    normalDay: string;
    luckyNumber: number;
    potEth: string;
    userTickets: number[];
    userTicketCount: number;
    totalTickets: number;
    winners: Winner[];
}

interface LeaderBoardPageProps {
    address: `0x${string}` | undefined
}

const UserHistoryPage: React.FC<LeaderBoardPageProps> = (
    address
) => {
    const [history, setHistory] = useState<UserHistoryItem[]>([]);

    function formatTicket(ticket: number | string): string {
        if (ticket === "" || ticket === 0 || ticket === "0" || ticket == null) {
            return "";
        }
        return String(ticket).padStart(5, "0");
    }

    useEffect(() => {
        async function fetchHistory() {
            log("current address:", address);
            let currentAddress = address?.address;
            try {
                const res = await fetch(`${BACKEND_API_URL}/baselottery/history?address=${currentAddress}`);
                if (!res.ok) {
                    log("fetch user history failed");
                    return;
                }
                const json = await res.json();
                setHistory(json.data || []);
            } catch (e) {
                log("fetch user history error", e);
            }
        }

        fetchHistory();
    }, []);

    // if (loading) {
    //     return <div className="lb-loading">Loading history...</div>;
    // }

    return (
        <div className="history-container">
            {history.map((day, index) => (
                <div className="history-card" key={index}>
                    
                    {/* Day */}
                    <div className="history-day">
                        Day {day.normalDay}
                    </div>

                    {/* Lucky number */}
                    <div className="history-lucky">
                        <strong>Lucky Ticket Number</strong>
                        <div className="history-lucky-number">
                            {formatTicket(day.luckyNumber)}
                        </div>
                        <div className="history-pot">
                            {Number(day.potEth).toFixed(6)} ETH
                        </div>
                    </div>

                    {/* Winners */}
                    <div className="history-winner">
                        <strong>Winner: </strong>
                        {day.winners.map((w) => (
                            <div className="winner-row" key={w.address}>
                                <img
                                    src={w.pfp_url || "/default-pfp.png"}
                                    className="lb-avatar"
                                    alt="pfp"
                                />
                                <div className="lb-info">
                                    <div className="lb-name">
                                        {w.username || w.address.slice(0, 6)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {day.winners.length == 0 && (
                            <strong className="no-winner">None</strong>
                        )}
                    </div>

                    {/* User tickets */}
                    <div className="history-user-tickets">
                        <strong>Your Tickets ({day.userTicketCount}/{day.totalTickets}):</strong>
                        <div className="ticket-list">
                            {day.userTickets.map((t) => (
                                <span className="ticket-pill" key={t}>
                                    {formatTicket(t)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserHistoryPage;
