export function RinkMarkings() {
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', top: 0, width: 5, height: '100%',
        transform: 'translateX(-50%)', background: 'rgba(226,59,78,.10)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 260, height: 260,
        transform: 'translate(-50%,-50%)',
        border: '5px solid rgba(22,87,199,.10)', borderRadius: '50%',
        pointerEvents: 'none'
      }} />
    </>
  )
}
