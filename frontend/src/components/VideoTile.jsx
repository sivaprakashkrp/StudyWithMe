import { useEffect, useRef } from 'react';

export default function VideoTile({
  title,
  stream,
  videoEnabled,
  avatarLetter,
  muted = false,
  sinkId = '',
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  useEffect(() => {
    const applySink = async () => {
      if (!videoRef.current || !sinkId) return;
      if (typeof videoRef.current.setSinkId !== 'function') return;

      try {
        await videoRef.current.setSinkId(sinkId);
      } catch (error) {
        console.warn('Failed setting output sink:', error);
      }
    };

    applySink();
  }, [sinkId]);

  return (
    <article className="rounded-2xl border border-slate-300/70 bg-white/75 p-3 shadow-sm backdrop-blur"
      data-video={videoEnabled ? 'on' : 'off'}
    >
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`aspect-video w-full rounded-xl bg-slate-900 object-cover ${videoEnabled ? '' : 'invisible'}`}
        />
        {!videoEnabled && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-linear-to-br from-cyan-900 to-slate-900 text-5xl text-slate-100">
            {avatarLetter}
          </div>
        )}
      </div>
    </article>
  );
}
