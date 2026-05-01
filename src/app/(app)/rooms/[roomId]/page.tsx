export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Room</h1>
      <p className="text-muted mt-2 text-sm">Coming in Step 12. Room: {params.roomId}</p>
    </div>
  )
}
