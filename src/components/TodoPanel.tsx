export type Todo = { id: string; title: string; minutes: number; done: boolean; core: boolean }
type Props = { todos: Todo[]; onChange: (todos: Todo[]) => void }

export default function TodoPanel({ todos, onChange }: Props) {
  const add = (form: HTMLFormElement) => { const data = new FormData(form); const title = String(data.get('title') || '').trim(); const minutes = Number(data.get('minutes') || 25); if (!title) return; onChange([...todos, { id: crypto.randomUUID(), title, minutes, done: false, core: false }]); form.reset() }
  const patch = (id: string, change: Partial<Todo>) => onChange(todos.map(t => t.id === id ? { ...t, ...change } : t))
  return <section className="side-card todo-panel"><div className="panel-heading"><div><span className="eyebrow">오늘의 할 일</span><h2>Todo</h2></div><strong>{todos.filter(t => t.done).length}/{todos.length}</strong></div>
    <form className="todo-form" onSubmit={e => { e.preventDefault(); add(e.currentTarget) }}><label className="sr-only" htmlFor="todo-title">할 일</label><input id="todo-title" name="title" placeholder="새로운 할 일을 입력하세요" maxLength={60}/><input aria-label="예상 시간(분)" name="minutes" type="number" min="5" max="600" defaultValue="25"/><button type="submit" aria-label="할 일 추가">＋</button></form>
    <ul className="todo-list">{todos.length === 0 ? <li className="empty">할 일을 추가해 오늘을 시작해 보세요.</li> : todos.map(todo => <li className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}><input checked={todo.done} onChange={() => patch(todo.id, { done: !todo.done })} type="checkbox" aria-label={`${todo.title} 완료`}/><div><span>{todo.title}</span><small>{todo.minutes}분 예상</small></div><button className={`core-btn ${todo.core ? 'active' : ''}`} onClick={() => patch(todo.id, { core: !todo.core })} aria-label="오늘의 핵심 지정">★</button><button className="delete-btn" onClick={() => onChange(todos.filter(t => t.id !== todo.id))} aria-label="할 일 삭제">×</button></li>)}</ul>
    <p className="hint">★ 오늘의 핵심 · 체크하면 완료 처리됩니다</p>
  </section>
}
