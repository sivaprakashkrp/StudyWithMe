import React, { useState } from 'react';

const EMOJIS = ['👍', '👏', '😂', '❤️', '🔥', '🎉'];

export default function ControlBar({
  joined,
  audioEnabled,
  videoEnabled,
  showWhiteboard,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleWhiteboard,
  onLeave,
  emojiMenuOpen,
  setEmojiMenuOpen,
  onEmoji,
  videoStreamStarted,
  meetingId,
}) {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/meet/${meetingId}`;
    navigator.clipboard.writeText(url);
    setShareMenuOpen(false);
  };

  return (
    <nav className="fixed right-2 bottom-2 left-2 z-40 mx-auto flex w-[min(900px,calc(100vw-1rem))] flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200/40 bg-slate-900/88 p-2 backdrop-blur">
      <button
        type="button"
        disabled={!joined}
        onClick={onToggleAudio}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {audioEnabled ? 'Mute' : 'Unmute'}
      </button>

      <button
        type="button"
        onClick={onToggleVideo}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
      >
        {!videoStreamStarted ? 'Start Video' : videoEnabled ? 'Stop Video' : 'Start Video'}
      </button>

      <button
        type="button"
        disabled={!joined}
        onClick={onToggleChat}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        Messages
      </button>

      <button
        type="button"
        onClick={onToggleWhiteboard}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
          showWhiteboard ? 'bg-green-600 hover:bg-green-700' : 'bg-cyan-700 hover:bg-cyan-800'
        }`}
      >
        {showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
      </button>

      

      {meetingId && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShareMenuOpen((prev) => !prev)}
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Share
          </button>

          {shareMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 min-w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full rounded-md bg-cyan-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-100"
              >
                Copy Meeting Link
              </button>
              
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={!joined}
          onClick={() => setEmojiMenuOpen((prev) => !prev)}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          Reactions
        </button>

        {!joined || !emojiMenuOpen ? null : (
          <div className="absolute bottom-full left-1/2 mb-2 grid min-w-40 -translate-x-1/2 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onEmoji(emoji);
                  setEmojiMenuOpen(false);
                }}
                className="rounded-md bg-cyan-50 px-2 py-1 text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!joined}
        onClick={onLeave}
        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        End Call
      </button>
    </nav>
  );
}
