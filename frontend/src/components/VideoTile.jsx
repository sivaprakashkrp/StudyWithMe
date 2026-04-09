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
    <article className="snap-start flex-shrink-0 rounded-xl border border-slate-300/70 bg-white/75 p-2 shadow-sm backdrop-blur h-[140px]"
      data-video={videoEnabled ? 'on' : 'off'}
    >
      <h3 className="mb-1 text-xs font-semibold text-slate-700 truncate">{title}</h3>
      <div className="relative h-[100px]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full rounded-lg bg-slate-900 object-cover ${videoEnabled ? '' : 'invisible'}`}
        />
        {!videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-linear-to-br from-cyan-900 to-slate-900 text-2xl text-slate-100">
            {avatarLetter}
          </div>
        )}
      </div>
    </article>
  );
}
