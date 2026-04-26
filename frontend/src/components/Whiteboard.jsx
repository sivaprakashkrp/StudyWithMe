import { Tldraw } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
import 'tldraw/tldraw.css'

export default function Whiteboard({ roomId }) {
  const store = useSyncDemo({ roomId })
  return (
    <div className="h-full w-full">
      <Tldraw store={store} />
    </div>
  )
}