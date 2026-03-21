import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const makeId = () => Math.random().toString(36).slice(2, 10);

export default function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [meetingId, setMeetingId] = useState(makeId);

  const canJoin = useMemo(() => username.trim().length > 0 && meetingId.trim().length > 0, [username, meetingId]);

  const handleJoin = (event) => {
    event.preventDefault();
    const safeMeeting = meetingId.trim();
    const safeUser = username.trim();
    if (!safeMeeting || !safeUser) return;

    navigate(`/meet/${encodeURIComponent(safeMeeting)}?username=${encodeURIComponent(safeUser)}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-[min(980px,calc(100vw-1rem))] items-center py-6">
      <section className="grid w-full gap-6 rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-xl backdrop-blur md:grid-cols-[1.1fr_1fr] md:p-10">
        <div>
          <p className="inline-block rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-800">
            React Meeting Feature
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-800 md:text-4xl">Join Your Meeting Room</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            This page is built to be copied into your existing project as a dedicated meeting endpoint.
            Enter your username and room ID, then continue to /meet/:meetingId.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={24}
              placeholder="Your name"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Meeting ID
            <input
              value={meetingId}
              onChange={(event) => setMeetingId(event.target.value)}
              placeholder="meeting-id"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
            />
          </label>

          <button
            type="submit"
            disabled={!canJoin}
            className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enter Meeting
          </button>
        </form>
      </section>
    </main>
  );
}
