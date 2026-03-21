export default function ChatPanel({
  open,
  messages,
  chatInput,
  setChatInput,
  onSend,
  onClose,
}) {
  return (
    <section
      className={`fixed right-2 bottom-24 z-30 w-[min(380px,calc(100vw-1rem))] rounded-2xl border border-slate-300/80 bg-white/95 shadow-2xl backdrop-blur transition ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
      aria-live="polite"
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-700">Meeting Chat</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
        >
          Close
        </button>
      </header>

      <div className="grid max-h-60 gap-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-xs text-slate-500">No messages yet.</p>}
        {messages.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg px-2 py-1 text-xs leading-relaxed ${
              item.local ? 'bg-amber-100/70' : 'bg-cyan-100/50'
            }`}
          >
            <strong className="text-slate-800">{item.sender}</strong>: {item.message}
          </div>
        ))}
      </div>

      <form
        onSubmit={onSend}
        className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-200 p-3"
      >
        <input
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          maxLength={300}
          placeholder="Send a message"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
        />
        <button
          type="submit"
          className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
        >
          Send
        </button>
      </form>
    </section>
  );
}
