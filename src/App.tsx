import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './lib/api'
import DonutChart, { TimeBlock } from './components/DonutChart'
import TodoPanel, { Todo } from './components/TodoPanel'
import TimerPanel from './components/TimerPanel'
type AppState = { blocks: TimeBlock[]; todos: Todo[]; sessions: number; theme: 'light' | 'dark' }
const baseBlocks: TimeBlock[] = [
  { id:'sleep', name:'수면', start:'23:00', end:'07:00', color:'#7b8496', note:'수면은 기억 정리와 회복을 돕습니다. 규칙적인 취침 시간을 유지해 보세요.' },
  { id:'focus1', name:'깊은 집중', start:'08:30', end:'11:30', color:'#2fb9a8', note:'방해 요소를 줄이고 가장 중요한 사고 작업에 집중하는 시간입니다.' },
  { id:'meal', name:'점심·산책', start:'12:00', end:'13:30', color:'#cbd2da', note:'식사와 짧은 산책으로 에너지를 부드럽게 회복하세요.' },
  { id:'focus2', name:'실행 집중', start:'14:00', end:'17:30', color:'#48bfc7', note:'협업과 실행 업무를 정리하기 좋은 시간대입니다.' },
  { id:'exercise', name:'운동', start:'18:00', end:'19:00', color:'#53ad75', note:'가벼운 운동은 기분과 수면 리듬에 좋은 영향을 줍니다.' },
  { id:'review', name:'회고·노트', start:'21:00', end:'22:00', color:'#9a78d6', note:'오늘의 감정과 배움을 기록하며 하루를 마무리하세요.' },
]
const defaults: AppState = { blocks: baseBlocks, todos: [{id:'welcome',title:'오늘의 가장 중요한 일 정하기',minutes:25,done:false,core:true}], sessions:0, theme:'light' }
const templates: Record<string, TimeBlock[]> = { '표준형': baseBlocks, '집중형': baseBlocks.map(x => x.id === 'focus1' ? {...x, start:'07:30', end:'12:00'} : x.id === 'focus2' ? {...x, start:'13:00',end:'18:00'} : x), '균형형': baseBlocks.map(x => x.id === 'exercise' ? {...x, start:'17:30',end:'19:00'} : x), '회복형': baseBlocks.map(x => x.id === 'sleep' ? {...x, start:'22:00',end:'07:30'} : x.id === 'focus2' ? {...x,start:'14:30',end:'16:30'} : x) }
export default function App() {
 const [state,setState] = useState<AppState>(defaults); const [loading,setLoading] = useState(true); const [selected,setSelected] = useState<TimeBlock | null>(null); const [message,setMessage] = useState('')
 useEffect(() => { (async() => { try { const saved = localStorage.getItem('rhythm-state'); if (saved) setState(JSON.parse(saved)); const res = await api('state'); const json = await res.json(); if (json.data && !saved) setState(json.data) } catch { setMessage('저장 정보를 불러오지 못해 기본 계획으로 시작합니다.') } finally { setLoading(false) } })() }, [])
 useEffect(() => { if (loading) return; try { localStorage.setItem('rhythm-state', JSON.stringify(state)); api('state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:state})}).catch(() => setMessage('현재 기기에 저장했어요.')) } catch { setMessage('변경 내용을 저장하지 못했습니다.') } },[state,loading])
 const update = (change: Partial<AppState>) => setState(s => ({...s,...change})); const tickSession = useCallback(() => update({sessions:state.sessions + 1}),[state.sessions])
 const focusBlocks = useMemo(() => state.blocks.filter(b => b.name.includes('집중')).length,[state.blocks]); const completed = state.todos.filter(t => t.done).length
 if (loading) return <div className="loading">오늘의 리듬을 불러오는 중입니다…</div>
 return <div className={`app ${state.theme}`}><header className="topbar"><div><span className="brand-mark">◌</span><strong>RHYTHM DAY</strong><span className="tagline">뇌과학 기반 하루 설계</span></div><div className="top-stats"><span>현재 시간 <b>{new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</b></span><span>집중 블록 <b>{focusBlocks}개</b></span><span>완료 세션 <b>{state.sessions}</b></span><button className="theme-btn" onClick={() => update({theme:state.theme === 'light' ? 'dark':'light'})}>{state.theme === 'light' ? '◐ 다크' : '☼ 라이트'}</button></div></header>
 <main><div className="template-row"><span>오늘의 리듬 템플릿</span>{Object.keys(templates).map(name=><button key={name} onClick={()=>{update({blocks:templates[name].map(b=>({...b}))});setMessage(`${name} 템플릿을 적용했습니다.`)}}>{name}</button>)}{message && <em>{message}</em>}</div><div className="dashboard"><aside><TodoPanel todos={state.todos} onChange={todos=>update({todos})}/></aside><section className="center-stage"><div className="section-title"><div><span className="eyebrow">24 HOURS / TODAY</span><h1>하루를 설계하세요</h1></div><span className="live-dot">현재 진행 중</span></div><DonutChart blocks={state.blocks} onSelect={setSelected}/><div className="legend">{state.blocks.map(b=><button onClick={()=>setSelected(b)} key={b.id}><i style={{background:b.color}}/>{b.name}</button>)}</div></section><aside><TimerPanel sessions={state.sessions} onSessionComplete={tickSession}/></aside></div><section className="summary"><article><span>완료한 태스크</span><strong>{completed}<small> / {state.todos.length}</small></strong><p>오늘의 작은 성취</p></article><article><span>예정 집중 시간</span><strong>{state.todos.filter(t=>!t.done).reduce((a,t)=>a+t.minutes,0)}<small>분</small></strong><p>남은 할 일 기준</p></article><article><span>완료 집중 세션</span><strong>{state.sessions}<small>회</small></strong><p>꾸준한 몰입의 기록</p></article><article><span>오늘의 핵심</span><strong>{state.todos.filter(t=>t.core&&!t.done).length}<small>개</small></strong><p>가장 중요한 일</p></article></section></main>{selected && <BlockModal block={selected} blocks={state.blocks} onClose={()=>setSelected(null)} onSave={block=>{update({blocks:state.blocks.map(b=>b.id===block.id?block:b)});setSelected(null)}}/>}</div>
}
function BlockModal({block,blocks,onClose,onSave}:{block:TimeBlock;blocks:TimeBlock[];onClose:()=>void;onSave:(b:TimeBlock)=>void}) {
 const [form,setForm]=useState(block); const [error,setError]=useState('')
 const minutes = (time:string) => { const [hour,minute] = time.split(':').map(Number); return hour * 60 + minute }
 const rangesOverlap = (candidate:TimeBlock, other:TimeBlock) => {
   const split = (item:TimeBlock) => { const start=minutes(item.start), end=minutes(item.end); return end > start ? [[start,end]] : [[start,1440],[0,end]] }
   return split(candidate).some(([start,end]) => split(other).some(([otherStart,otherEnd]) => start < otherEnd && otherStart < end))
 }
 const save = () => {
   if (!form.name.trim()) { setError('활동 이름을 입력해 주세요.'); return }
   if (form.start === form.end) { setError('시작 시간과 종료 시간은 다르게 설정해 주세요.'); return }
   if (blocks.some(other => other.id !== form.id && rangesOverlap(form, other))) { setError('다른 시간 블록과 겹칩니다. 빈 시간대로 조정해 주세요.'); return }
   onSave(form)
 }
 return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">시간 블록 편집</span><h2 id="modal-title">{block.name}</h2><p>{block.note}</p><div className="edit-grid"><label>이름<input value={form.name} onChange={e=>{setForm({...form,name:e.target.value});setError('')}}/></label><label>색상<input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></label><label>시작 시간<input type="time" value={form.start} onChange={e=>{setForm({...form,start:e.target.value});setError('')}}/></label><label>종료 시간<input type="time" value={form.end} onChange={e=>{setForm({...form,end:e.target.value});setError('')}}/></label></div><label>설명<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button onClick={onClose}>취소</button><button className="primary" onClick={save}>변경 저장</button></div></section></div> }
