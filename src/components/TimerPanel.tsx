import { useEffect, useState } from 'react'
type Props = { sessions: number; onSessionComplete: () => void }
const modes = [{ label: '25분', seconds: 1500 }, { label: '50분', seconds: 3000 }, { label: '90분', seconds: 5400 }]
export default function TimerPanel({ sessions, onSessionComplete }: Props) {
  const [selected, setSelected] = useState(1500)
  const [left, setLeft] = useState(1500)
  const [running, setRunning] = useState(false)
  const [breakMode, setBreakMode] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [error, setError] = useState('')
  const playCompletionSound = (isBreakEnding: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const context = new AudioContextClass()
      const frequencies = isBreakEnding ? [784, 988] : [523, 659, 784]
      const repeats = 8
      const interval = 0.6
      frequencies.forEach((frequency, noteIndex) => {
        for (let repeat = 0; repeat < repeats; repeat += 1) {
          const startAt = context.currentTime + repeat * interval + noteIndex * 0.12
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.value = frequency
          gain.gain.setValueAtTime(0.0001, startAt)
          gain.gain.exponentialRampToValueAtTime(0.13, startAt + 0.03)
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22)
          oscillator.connect(gain).connect(context.destination)
          oscillator.start(startAt)
          oscillator.stop(startAt + 0.24)
        }
      })
      window.setTimeout(() => context.close(), 5400)
    } catch {
      // 브라우저의 오디오 재생 제한이 있는 경우에도 타이머 전환은 계속됩니다.
    }
  }
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setLeft(v => {
      if (v <= 1) {
        playCompletionSound(breakMode)
        setRunning(false)
        if (!breakMode) { onSessionComplete(); setBreakMode(true); return sessions % 4 === 3 ? 900 : 300 }
        setBreakMode(false); return selected
      }
      return v - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [running, selected, breakMode, sessions, onSessionComplete])
  const choose = (seconds: number) => { setSelected(seconds); setLeft(seconds); setBreakMode(false); setRunning(false); setError('') }
  const applyCustom = () => {
    const minutes = Number(customMinutes)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) { setError('1분부터 180분 사이로 입력해 주세요.'); return }
    choose(minutes * 60); setCustomMinutes('')
  }
  const reset = () => { setRunning(false); setBreakMode(false); setLeft(selected) }
  const restSeconds = sessions % 4 === 0 ? 900 : 300
  const progress = 1 - left / (breakMode ? restSeconds : selected)
  const display = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`
  return <section className="side-card timer-panel"><div className="panel-heading"><div><span className="eyebrow">집중 흐름</span><h2>타이머</h2></div><span className={`timer-state ${breakMode ? 'rest' : ''}`}>{breakMode ? '휴식 중' : '집중 중'}</span></div><div className="timer-ring" style={{ '--progress': String(progress) } as React.CSSProperties}><div><strong>{display}</strong><span>{breakMode ? '회복 시간' : '몰입 시간'}</span></div></div><div className="mode-tabs">{modes.map(mode => <button key={mode.seconds} className={selected === mode.seconds && !breakMode ? 'selected' : ''} onClick={() => choose(mode.seconds)}>{mode.label}</button>)}</div><div className="timer-actions"><button className="primary" onClick={() => setRunning(!running)}>{running ? '일시정지' : '시작하기'}</button><button onClick={reset}>초기화</button></div><div className="timer-setting"><div className="custom-setting"><label htmlFor="custom-minutes">타이머 직접 설정 · 집중 시간(분)</label><div><input id="custom-minutes" type="number" min="1" max="180" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} placeholder="예: 40"/><button onClick={applyCustom}>적용</button></div>{error && <p role="alert">{error}</p>}</div></div><p className="timer-note">완료 {sessions}세션 · {4 - (sessions % 4 || 4)}세션 후 긴 휴식</p></section>
}
