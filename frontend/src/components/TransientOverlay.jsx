export default function TransientOverlay({ messageToasts, reactions }) {
  return (
    <>
      <section className="pointer-events-none fixed top-3 right-3 z-30 grid w-[min(360px,calc(100vw-1.5rem))] gap-2">
        {messageToasts.map((toast) => (
          <div
            key={toast.id}
            className="message-fade rounded-lg border border-cyan-200 bg-white/92 px-3 py-2 text-xs shadow"
          >
            <strong>{toast.sender}</strong>: {toast.message}
          </div>
        ))}
      </section>

      <section className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="reaction-float absolute bottom-24 rounded-full bg-white/90 px-3 py-2 text-sm shadow-lg"
            style={{ left: reaction.left }}
          >
            <span className="font-semibold text-slate-700">{reaction.username}</span> {reaction.emoji}
          </div>
        ))}
      </section>
    </>
  );
}
