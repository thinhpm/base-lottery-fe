import React, {useEffect, useState} from 'react';
import {log} from '../hooks/helper';
import {BACKEND_API_URL} from '../config/env';


interface LeaderboardItem {
    buyer: string,
    total: number,
    username: string,
    pfp_url?: string
}

type LeaderboardData = {
    today: LeaderboardItem[];
    week: LeaderboardItem[];
    allTime: LeaderboardItem[];
};

type TabType = "today" | "week" | "allTime";



interface LeaderBoardPageProps {
}

const LeaderBoardPage: React.FC<LeaderBoardPageProps> = ({
}) => {
    const [tab, setTab] = useState<TabType>("today");
    const [dataLeaderBoard, setDataLeaderBoard] = useState<LeaderboardData>({
        today: [],
        week: [],
        allTime: []
    });
    const [dataItemBoard, setDataItemBoard] = useState<LeaderboardItem[]>([]);
    const tabs: TabType[] = ["today", "week", "allTime"];


    // const dataLeaderBoard: Record<string, LeaderboardItem[]> = {
    //     today: [],
    //     week: [],
    //     all: []
    // };

    useEffect(() => {
        async function getLeaderBoard() {
            const response = await fetch(`${BACKEND_API_URL}/baselottery/leaderboard`);

            if (!response.ok) {
                log("get leaderboard failed");
            }

            const data = await response.json();
            return data['data'];
        }

        async function buildLeaderBoard() {
            const data = await getLeaderBoard();
            setDataLeaderBoard({
                today: data?.today ?? [],
                week: data?.week ?? [],
                allTime: data?.allTime ?? []
            });
        }
        
        buildLeaderBoard();
    }, []);

    useEffect(() => {
        setDataItemBoard(dataLeaderBoard[tab] || []);
    }, [tab, dataLeaderBoard]);


    return (
        <>
        <div className="lb-tabs">
            {tabs.map(t => (
                <button
                key={t}
                className={tab === t ? "lb-tab active" : "lb-tab"}
                onClick={() => setTab(t)}
                >
                {t === "today" && "Today"}
                {t === "week" && "Week"}
                {t === "allTime" && "All Time"}
                </button>
            ))}
        </div>
        <div>
            <div className="lb-list">
                {dataItemBoard.map((item: any, index) => (
                    <div className="lb-item" key={item.buyer}>
                    
                    <div className="lb-rank">
                        {index + 1}
                    </div>

                    <img 
                        src={item.pfp_url || "/default-pfp.png"} 
                        className="lb-avatar"
                        alt="pfp"
                    />

                    <div className="lb-info">
                        <div className="lb-name">{item.username.length > 0 ? item.username : item.buyer.slice(0,6) + "..." + item.buyer.slice(-4)}</div>
                        <div className="lb-address">{item.buyer.slice(0,6)}...{item.buyer.slice(-4)}</div>
                    </div>

                    <div className="lb-total">
                        🎟 {item.total}
                    </div>

                    </div>
                ))}    
            </div>
        </div>
        </>
    );
};
    
export default LeaderBoardPage;