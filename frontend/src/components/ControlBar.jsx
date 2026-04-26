const EMOJIS = ['👍', '👏', '😂', '❤️', '🔥', '🎉'];

export default function ControlBar({
  joined,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleWhiteboard,
  whiteboardVisible,
  onLeave,
  emojiMenuOpen,
  setEmojiMenuOpen,
  onEmoji,
}) {
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
        disabled={!joined}
        onClick={onToggleVideo}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {videoEnabled ? 'Stop Video' : 'Start Video'}
      </button>

      <button
        type="button"
        disabled={!joined}
        onClick={onToggleWhiteboard}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {whiteboardVisible ? 'Hide Whiteboard' : 'Show Whiteboard'}
      </button>

      <button
        type="button"
        disabled={!joined}
        onClick={onToggleChat}
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        Messages
      </button>

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