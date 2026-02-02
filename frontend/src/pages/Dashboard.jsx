import React from 'react';

const Dashboard = () => {
    const handleStartMeeting = () => {
        console.log('Starting a new meeting...');
    };
    return (
        <main className="flex-1 flex flex-col items-center pt-16 px-8 bg-white">
        <div className="w-full max-w-4xl">
            {/* User Greeting */}
            <h1 className="text-3xl font-medium mb-16 text-left">
                Hello, User!
            </h1>
        </div>

        <div className="flex flex-col items-center">
            <h3 className="text-2xl mb-8 font-light">Start a new meeting</h3>

            {/* Dashboard Action Button */}
            <button
                onClick={handleStartMeeting}
                className="flex flex-col bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
            >
                <div className="w-20 h-20 border-2 border-black rounded-full flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                    <span className="text-5xl font-light leading-none">+</span>
                </div>

                <span className="text-xl font-medium tracking-wide">
                    Start A New Instant Meeting
                </span>
            </button>
        </div>
    </main>
    );
};

export default Dashboard;