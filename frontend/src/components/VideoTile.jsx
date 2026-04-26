import { useEffect, useRef } from 'react';

export default function VideoTile({
  title,
  stream,
  videoEnabled,
  avatarLetter,
  muted = false,
  sinkId = '',
  compact = false,
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

  const padding = compact ? 'p-1.5' : 'p-3';
  const titleSize = compact ? 'text-xs' : 'text-sm';
  const avatarSize = compact ? 'text-3xl' : 'text-5xl';
  const marginBottom = compact ? 'mb-1' : 'mb-2';

  return (
    <article className={`rounded-xl border border-slate-300/70 bg-white/75 shadow-sm backdrop-blur ${padding}`}
      data-video={videoEnabled ? 'on' : 'off'}
    >
      <h3 className={`${marginBottom} ${titleSize} font-semibold text-slate-700 truncate`}>{title}</h3>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`aspect-video w-full rounded-lg bg-slate-900 object-cover ${videoEnabled ? '' : 'invisible'}`}
        />
        {!videoEnabled && (
          <div className={`absolute inset-0 grid place-items-center rounded-lg bg-linear-to-br from-cyan-900 to-slate-900 ${avatarSize} text-slate-100`}>
            {avatarLetter}
          </div>
        )}
      </div>
    </article>
  );
}