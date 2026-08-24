export type TimeBlock = { id: string; name: string; start: string; end: string; color: string; note: string }
type Props = { blocks: TimeBlock[]; onSelect: (block: TimeBlock) => void }
const point = (angle: number, radius: number) => {
  const rad = ((angle - 90) * Math.PI) / 180
  return [160 + radius * Math.cos(rad), 160 + radius * Math.sin(rad)]
}
const toAngle = (time: string) => {
  const [hour, minute] = time.split(':').map(Number)
  return (hour * 60 + minute) / 4
}
export default function DonutChart({ blocks, onSelect }: Props) {
  const now = new Date(); const minute = now.getHours() * 60 + now.getMinutes(); const nowAngle = minute / 4
  return <div className="donut-wrap">
    <svg viewBox="0 0 320 320" className="donut" role="img" aria-label="24시간 하루 리듬 계획표">
      <circle cx="160" cy="160" r="116" fill="none" stroke="var(--color-border)" strokeWidth="28" />
      {blocks.map((block, index) => {
        const start = toAngle(block.start); let end = toAngle(block.end); if (end <= start) end += 360
        const span = end - start; const a = point(start, 116); const b = point(end, 116); const large = span > 180 ? 1 : 0
        const middle = start + span / 2
        const label = point(middle, 116)
        const fontSize = span < 24 ? 7.2 : span < 42 ? 8.2 : 9.4
        return <g key={block.id} className="donut-block" onClick={() => onSelect(block)}>
          <path className="donut-segment" d={`M ${a[0]} ${a[1]} A 116 116 0 ${large} 1 ${b[0]} ${b[1]}`} fill="none" stroke={block.color} strokeWidth="28" strokeLinecap="butt" />
          <text className="block-label" x={label[0]} y={label[1]} textAnchor="middle" dominantBaseline="middle" style={{ fontSize }}>{block.name}</text>
        </g>
      })}
      <line x1="160" y1="160" x2={point(nowAngle, 98)[0]} y2={point(nowAngle, 98)[1]} className="now-hand" />
      <circle cx="160" cy="160" r="5" className="now-dot" />
    </svg>
    <div className="donut-center"><span>오늘의 리듬</span><strong>{now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</strong><small>블록을 눌러 편집</small></div>
    <div className="clock-label label-0">00</div><div className="clock-label label-6">06</div><div className="clock-label label-12">12</div><div className="clock-label label-18">18</div>
  </div>
}
