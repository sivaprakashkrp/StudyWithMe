import React from 'react';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const handleStartMeeting = () => {
        console.log('Starting a new meeting...');
    };
    return (
        <>
            <Navbar />
            <main className="flex-1 flex flex-col pt-8 px-8 bg-white">
        <div className="w-full max-w-4xl">
            {/* User Greeting */}
            <h1 className="font-bold font-days text-5xl mb-16 text-left">
                Hello, User!
            </h1>
        </div>

        <div className="flex flex-col items-center pb-16">
            <h3 className="text-4xl mb-8 font-days">Start a new meeting</h3>

            {/* Dashboard Action Button */}
            <button
                onClick={handleStartMeeting}
                className="flex flex-col bg-gray-300 items-center-safe text-black px-26 py-18 rounded-md hover:bg-gray-400 transition"
            >
                <div className="w-25 h-25 border-2 bg-swm-blue border-black rounded-full flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                    <span className="text-5xl font-light leading-none">+</span>
                </div>

                <span className="text-xl font-days tracking-wide">
                    Start A New Instant Meeting
                </span>
            </button>
        </div>
    </main>
        </>
    );
};

export default Dashboard;