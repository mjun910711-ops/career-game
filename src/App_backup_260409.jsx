import { useMemo, useState } from 'react'
import './App.css'

const JOBS = {
  office: {
    label: '사무/기획',
    aiRisk: 72,
    bodyLoad: 35,
    stressBase: 62,
    growth: 50,
    description:
      '문서, 보고, 조율 업무 비중이 높아 AI 자동화 영향이 빠르게 반영됩니다.',
  },
  developer: {
    label: '개발/IT',
    aiRisk: 54,
    bodyLoad: 28,
    stressBase: 66,
    growth: 72,
    description:
      'AI 보조를 잘 활용하면 생산성이 커지지만, 학습 압박도 함께 커집니다.',
  },
  healthcare: {
    label: '의료/돌봄',
    aiRisk: 26,
    bodyLoad: 66,
    stressBase: 58,
    growth: 69,
    description:
      '대면 상호작용과 현장 대응력이 중요해 AI 대체 리스크는 낮습니다.',
  },
  manufacturing: {
    label: '제조/현장',
    aiRisk: 48,
    bodyLoad: 74,
    stressBase: 55,
    growth: 57,
    description:
      '자동화 리스크와 신체 부담이 동시에 존재하는 직군입니다.',
  },
  service: {
    label: '서비스/영업',
    aiRisk: 44,
    bodyLoad: 46,
    stressBase: 64,
    growth: 60,
    description:
      '감정노동과 실적 압박이 크며, 일부 업무는 AI로 빠르게 전환됩니다.',
  },
}

const ACTIONS = [
  {
    key: 'health',
    title: '건강 투자',
    desc: '운동, 수면, 회복 루틴에 시간을 씁니다.',
    effect: { health: 11, adaptability: 0, money: -4, stress: -8, resilience: 6 },
  },
  {
    key: 'ai',
    title: 'AI 역량 강화',
    desc: '자동화 도구를 배우고 업무 방식을 바꿉니다.',
    effect: { health: -2, adaptability: 12, money: -2, stress: 2, resilience: 4 },
  },
  {
    key: 'work',
    title: '고강도 업무 몰입',
    desc: '실적과 승진을 위해 강하게 드라이브를 겁니다.',
    effect: { health: -9, adaptability: 2, money: 7, stress: 9, resilience: -2 },
  },
  {
    key: 'balance',
    title: '균형 조정',
    desc: '업무 효율을 높이고 노동시간을 일부 조정합니다.',
    effect: { health: 5, adaptability: 5, money: 1, stress: -5, resilience: 3 },
  },
  {
    key: 'pivot',
    title: '직무 전환 준비',
    desc: '새 역할 탐색과 리스킬링을 병행합니다.',
    effect: { health: -3, adaptability: 10, money: -3, stress: 4, resilience: 8 },
  },
]

const EVENT_POOL = [
  {
    title: 'AI 자동화 가속',
    text: '당신의 산업에서 생성형 AI 도입이 빨라지며 반복업무가 크게 줄어듭니다.',
    apply: (s) => ({
      ...s,
      jobSecurity: clamp(s.jobSecurity - Math.round((s.aiRisk - s.adaptability * 0.45) / 7), 0, 100),
      stress: clamp(s.stress + 5, 0, 100),
    }),
  },
  {
    title: '건강 경고 신호',
    text: '피로 누적과 수면 부족으로 컨디션이 떨어졌습니다.',
    apply: (s) => ({
      ...s,
      health: clamp(s.health - Math.max(4, Math.round(s.workHours / 11)), 0, 100),
      stress: clamp(s.stress + 4, 0, 100),
    }),
  },
  {
    title: '성과 기회',
    text: '중요 프로젝트를 맡으며 수입과 평판이 오를 수 있는 기회가 왔습니다.',
    apply: (s) => ({
      ...s,
      money: clamp(s.money + 5, 0, 100),
      jobSecurity: clamp(s.jobSecurity + 4, 0, 100),
      stress: clamp(s.stress + 3, 0, 100),
    }),
  },
  {
    title: '리스킬링 보조금',
    text: '정부·회사 지원으로 재교육 비용 부담이 줄었습니다.',
    apply: (s) => ({
      ...s,
      adaptability: clamp(s.adaptability + 6, 0, 100),
      resilience: clamp(s.resilience + 5, 0, 100),
    }),
  },
  {
    title: '시장 둔화',
    text: '산업 성장세가 약화되며 고용 안정성이 흔들립니다.',
    apply: (s) => ({
      ...s,
      jobSecurity: clamp(s.jobSecurity - 7, 0, 100),
      money: clamp(s.money - 4, 0, 100),
    }),
  },
  {
    title: '업무 재설계 성공',
    text: 'AI와 협업하는 방식이 자리잡으며 효율이 높아졌습니다.',
    apply: (s) => ({
      ...s,
      jobSecurity: clamp(s.jobSecurity + 6, 0, 100),
      adaptability: clamp(s.adaptability + 4, 0, 100),
      stress: clamp(s.stress - 5, 0, 100),
    }),
  },
]

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function scoreCareer(state) {
  const healthFactor = state.health * 0.35
  const jobFactor = state.jobSecurity * 0.3
  const adaptFactor = state.adaptability * 0.2
  const resilienceFactor = state.resilience * 0.15
  const penalty = state.stress * 0.18 + (100 - state.money) * 0.05
  return clamp(Math.round(healthFactor + jobFactor + adaptFactor + resilienceFactor - penalty + 10), 0, 100)
}

function estimateWorkableAge(state) {
  const now = state.age
  const bonus = Math.round((state.health + state.jobSecurity + state.adaptability + state.resilience - state.stress) / 18)
  return clamp(now + bonus, now, 75)
}

function buildInitialState(form) {
  const job = JOBS[form.job]
  const health = clamp(form.health * 20 + (form.exercise - 3) * 4 - Math.max(0, form.workHours - 45) * 0.5, 25, 95)
  const adaptability = clamp(form.aiSkill * 18 + (form.learningWill - 3) * 5, 20, 95)
  const stress = clamp(job.stressBase + Math.max(0, form.workHours - 45) * 0.8 - (form.health - 3) * 3, 20, 95)
  const jobSecurity = clamp(100 - job.aiRisk + job.growth * 0.35 + form.aiSkill * 3, 25, 95)
  const resilience = clamp(52 + (form.exercise - 3) * 6 + (form.learningWill - 3) * 5 - Math.max(0, form.workHours - 50) * 0.4, 20, 95)
  const money = clamp(55 + (form.workHours - 40) * 0.9 + (job.growth - 50) * 0.2, 30, 90)

  return {
    age: form.age,
    name: form.name || '플레이어',
    jobKey: form.job,
    jobLabel: job.label,
    aiRisk: job.aiRisk,
    bodyLoad: job.bodyLoad,
    workHours: form.workHours,
    health,
    adaptability,
    stress,
    jobSecurity,
    resilience,
    money,
  }
}

function getYearlyEvent(year, scenarioBias) {
  const idx = (year * 3 + scenarioBias * 5) % EVENT_POOL.length
  return EVENT_POOL[idx]
}

function applyScenarioDrift(state, scenario) {
  const next = { ...state }

  if (scenario === 'optimistic') {
    next.jobSecurity = clamp(next.jobSecurity + 2, 0, 100)
    next.health = clamp(next.health + 1, 0, 100)
    next.stress = clamp(next.stress - 2, 0, 100)
  }

  if (scenario === 'baseline') {
    next.jobSecurity = clamp(next.jobSecurity - Math.round(next.aiRisk / 35), 0, 100)
    next.health = clamp(next.health - Math.round(next.bodyLoad / 50), 0, 100)
    next.stress = clamp(next.stress + 1, 0, 100)
  }

  if (scenario === 'pessimistic') {
    next.jobSecurity = clamp(next.jobSecurity - Math.round(next.aiRisk / 20), 0, 100)
    next.health = clamp(next.health - Math.round(next.bodyLoad / 35), 0, 100)
    next.stress = clamp(next.stress + 4, 0, 100)
    next.money = clamp(next.money - 2, 0, 100)
  }

  next.age += 1
  return next
}

function simulateOneStep(current, actionKey, scenario, year) {
  const action = ACTIONS.find((a) => a.key === actionKey)
  let next = { ...current }

  next.health = clamp(next.health + action.effect.health, 0, 100)
  next.adaptability = clamp(next.adaptability + action.effect.adaptability, 0, 100)
  next.money = clamp(next.money + action.effect.money, 0, 100)
  next.stress = clamp(next.stress + action.effect.stress, 0, 100)
  next.resilience = clamp(next.resilience + action.effect.resilience, 0, 100)

  next = applyScenarioDrift(next, scenario)

  const event = getYearlyEvent(year, scenario === 'optimistic' ? 1 : scenario === 'pessimistic' ? 3 : 2)
  next = event.apply(next)

  next.jobSecurity = clamp(
    next.jobSecurity + Math.round(next.adaptability / 25) - Math.round(next.stress / 30),
    0,
    100
  )

  next.health = clamp(next.health - Math.max(0, Math.round((next.workHours - 48) / 4)), 0, 100)

  const score = scoreCareer(next)
  const workableAge = estimateWorkableAge(next)

  return {
    next,
    score,
    workableAge,
    event,
    action,
  }
}

function simulateFuture(initialState, scenario, decisions) {
  let state = { ...initialState }
  let finalScore = scoreCareer(state)
  let workableAge = estimateWorkableAge(state)

  for (let year = 1; year <= decisions.length; year += 1) {
    const result = simulateOneStep(state, decisions[year - 1], scenario, year)
    state = result.next
    finalScore = result.score
    workableAge = result.workableAge

    if (state.health <= 15 || state.jobSecurity <= 15) break
  }

  return {
    finalState: state,
    finalScore,
    workableAge,
  }
}

function ProgressBar({ label, value, danger = false }) {
  return (
    <div className="progress-group">
      <div className="progress-label">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${danger ? 'danger' : ''}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function App() {
  const [phase, setPhase] = useState('intro')
  const [form, setForm] = useState({
    name: '',
    age: 30,
    job: 'office',
    workHours: 45,
    health: 3,
    exercise: 3,
    aiSkill: 3,
    learningWill: 3,
  })

  const [scenario, setScenario] = useState('baseline')
  const [state, setState] = useState(null)
  const [turn, setTurn] = useState(1)
  const [log, setLog] = useState([])
  const [lastEvent, setLastEvent] = useState(null)

  const maxTurns = 8

  const currentScore = useMemo(() => (state ? scoreCareer(state) : 0), [state])
  const workableAge = useMemo(() => (state ? estimateWorkableAge(state) : 0), [state])

  const decisions = log
    .filter((item) => item.actionKey)
    .map((item) => item.actionKey)

  const scenarioPreview = useMemo(() => {
    if (!state) return null
    const initial = buildInitialState(form)
    const filled = [...decisions]
    while (filled.length < maxTurns) filled.push('balance')

    return {
      optimistic: simulateFuture(initial, 'optimistic', filled),
      baseline: simulateFuture(initial, 'baseline', filled),
      pessimistic: simulateFuture(initial, 'pessimistic', filled),
    }
  }, [state, form, decisions])

  const startGame = () => {
    const initial = buildInitialState(form)
    setState(initial)
    setTurn(1)
    setLog([
      {
        turn: 0,
        score: scoreCareer(initial),
        action: '시작',
        event: '초기 진단',
      },
    ])
    setLastEvent({
      title: '초기 진단',
      text: JOBS[form.job].description,
    })
    setPhase('play')
  }

  const playTurn = (actionKey) => {
    const result = simulateOneStep(state, actionKey, scenario, turn)

    setState(result.next)
    setLastEvent(result.event)
    setLog((prev) => [
      ...prev,
      {
        turn,
        score: result.score,
        action: result.action.title,
        actionKey,
        event: result.event.title,
      },
    ])

    if (turn >= maxTurns || result.next.health <= 15 || result.next.jobSecurity <= 15) {
      setPhase('result')
    } else {
      setTurn((t) => t + 1)
    }
  }

  const restart = () => {
    setPhase('intro')
    setState(null)
    setTurn(1)
    setLog([])
    setLastEvent(null)
    setScenario('baseline')
  }

  const renderLineBars = () => {
    if (log.length <= 1) return <p className="muted">아직 연도별 데이터가 없습니다.</p>

    const playableLog = log.slice(1)

    return (
      <div className="chart-list">
        {playableLog.map((item) => (
          <div key={item.turn} className="chart-row">
            <div className="chart-row-head">
              <span>{item.turn}년차</span>
              <span>{item.score}점</span>
            </div>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ width: `${item.score}%` }} />
            </div>
            <div className="chart-meta">
              <span>선택: {item.action}</span>
              <span>이벤트: {item.event}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="shell">
        <header className="hero">
          <div>
            <div className="eyebrow">Career Sustainability Simulator</div>
            <h1>건강수명 + AI 직업 리스크 미래 커리어 시뮬레이션</h1>
            <p>
              개인의 건강 상태, 직무 특성, AI 변화 대응력을 결합해 향후 커리어 지속가능성을
              플레이 형태로 체험하는 시뮬레이션 게임입니다.
            </p>
          </div>
          {phase !== 'intro' && state && (
            <button className="secondary-btn" onClick={restart}>
              처음부터 다시
            </button>
          )}
        </header>

        {phase === 'intro' && (
          <div className="grid two">
            <section className="card">
              <h2>플레이어 설정</h2>
              <p className="muted">
                입력값을 바탕으로 초기 건강, 직업 안정성, AI 적응력이 계산됩니다.
              </p>

              <div className="form-grid">
                <label>
                  이름
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 민준"
                  />
                </label>

                <label>
                  나이
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  />
                </label>

                <label>
                  직업군
                  <select
                    value={form.job}
                    onChange={(e) => setForm({ ...form, job: e.target.value })}
                  >
                    {Object.entries(JOBS).map(([key, job]) => (
                      <option key={key} value={key}>
                        {job.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  미래 시나리오
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                  >
                    <option value="optimistic">낙관</option>
                    <option value="baseline">기준</option>
                    <option value="pessimistic">비관</option>
                  </select>
                </label>

                <label>
                  주당 노동시간
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={form.workHours}
                    onChange={(e) => setForm({ ...form, workHours: Number(e.target.value) })}
                  />
                  <span className="range-value">{form.workHours}시간</span>
                </label>

                <label>
                  주관적 건강 상태
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.health}
                    onChange={(e) => setForm({ ...form, health: Number(e.target.value) })}
                  />
                  <span className="range-value">{form.health}/5</span>
                </label>

                <label>
                  운동/회복 습관
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.exercise}
                    onChange={(e) => setForm({ ...form, exercise: Number(e.target.value) })}
                  />
                  <span className="range-value">{form.exercise}/5</span>
                </label>

                <label>
                  AI 도구 활용 수준
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.aiSkill}
                    onChange={(e) => setForm({ ...form, aiSkill: Number(e.target.value) })}
                  />
                  <span className="range-value">{form.aiSkill}/5</span>
                </label>

                <label>
                  재교육 의지
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.learningWill}
                    onChange={(e) =>
                      setForm({ ...form, learningWill: Number(e.target.value) })
                    }
                  />
                  <span className="range-value">{form.learningWill}/5</span>
                </label>
              </div>

              <button className="primary-btn" onClick={startGame}>
                시뮬레이션 시작
              </button>
            </section>

            <section className="card">
              <h2>게임 목표</h2>
              <div className="info-box">
                <strong>승리 조건</strong>
                <p>8개 연차 동안 건강과 직업 안정성을 유지하며 높은 점수를 확보합니다.</p>
              </div>
              <div className="info-box">
                <strong>실패 조건</strong>
                <p>건강 또는 직업 안정성이 급격히 악화되면 시뮬레이션이 조기 종료됩니다.</p>
              </div>
              <div className="info-box">
                <strong>핵심 전략</strong>
                <p>단기 성과만 올리면 후반부에 무너질 수 있습니다. 균형이 중요합니다.</p>
              </div>
            </section>
          </div>
        )}

        {phase !== 'intro' && state && (
          <div className="grid main-layout">
            <aside className="left-panel">
              <section className="card">
                <h2>현재 상태</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <span>이름</span>
                    <strong>{state.name}</strong>
                  </div>
                  <div className="stat-box">
                    <span>직업군</span>
                    <strong>{state.jobLabel}</strong>
                  </div>
                  <div className="stat-box">
                    <span>현재 나이</span>
                    <strong>{state.age}세</strong>
                  </div>
                  <div className="stat-box">
                    <span>지속가능성 점수</span>
                    <strong>{currentScore}점</strong>
                  </div>
                </div>

                <ProgressBar label="건강" value={state.health} />
                <ProgressBar label="직업 안정성" value={state.jobSecurity} />
                <ProgressBar label="AI 적응력" value={state.adaptability} />
                <ProgressBar label="회복탄력성" value={state.resilience} />
                <ProgressBar label="경제적 자원" value={state.money} />
                <ProgressBar label="스트레스" value={state.stress} danger />

                <div className="info-box">
                  <strong>예상 근로 가능 연령</strong>
                  <p className="big-number">{workableAge}세</p>
                </div>
              </section>

              <section className="card">
                <h2>최근 이벤트</h2>
                <div className="event-box">
                  <strong>{lastEvent?.title}</strong>
                  <p>{lastEvent?.text}</p>
                </div>
              </section>
            </aside>

            <main className="right-panel">
              {phase === 'play' && (
                <>
                  <section className="card">
                    <h2>{turn}년차 의사결정</h2>
                    <p className="muted">
                      현재 시나리오: {scenario === 'optimistic' ? '낙관' : scenario === 'baseline' ? '기준' : '비관'}
                    </p>

                    <div className="action-grid">
                      {ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          className="action-card"
                          onClick={() => playTurn(action.key)}
                        >
                          <h3>{action.title}</h3>
                          <p>{action.desc}</p>
                          <div className="tags">
                            {Object.entries(action.effect).map(([k, v]) => (
                              <span key={k} className="tag">
                                {k} {v > 0 ? `+${v}` : v}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="card">
                    <h2>플레이 로그</h2>
                    <div className="log-list">
                      {log.slice(1).reverse().map((item) => (
                        <div key={item.turn} className="log-item">
                          <div className="log-head">
                            <strong>{item.turn}년차 · {item.action}</strong>
                            <span>{item.score}점</span>
                          </div>
                          <p>이벤트: {item.event}</p>
                        </div>
                      ))}
                      {log.length === 1 && <p className="muted">아직 로그가 없습니다.</p>}
                    </div>
                  </section>
                </>
              )}

              {phase === 'result' && (
                <>
                  <section className="card">
                    <h2>최종 리포트</h2>
                    <div className="result-grid">
                      <div className="result-box rose">
                        <span>최종 점수</span>
                        <strong>{currentScore}점</strong>
                      </div>
                      <div className="result-box blue">
                        <span>예상 근로 가능 연령</span>
                        <strong>{workableAge}세</strong>
                      </div>
                      <div className="result-box green">
                        <span>종합 판정</span>
                        <strong>
                          {currentScore >= 75 ? '안정적' : currentScore >= 55 ? '관리 필요' : '고위험'}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="card">
                    <h2>연도별 변화</h2>
                    {renderLineBars()}
                  </section>

                  {scenarioPreview && (
                    <section className="card">
                      <h2>시나리오 비교</h2>
                      <div className="result-grid">
                        <div className="result-box green">
                          <span>낙관 시나리오</span>
                          <strong>{scenarioPreview.optimistic.finalScore}점</strong>
                          <small>{scenarioPreview.optimistic.workableAge}세까지</small>
                        </div>
                        <div className="result-box">
                          <span>기준 시나리오</span>
                          <strong>{scenarioPreview.baseline.finalScore}점</strong>
                          <small>{scenarioPreview.baseline.workableAge}세까지</small>
                        </div>
                        <div className="result-box rose">
                          <span>비관 시나리오</span>
                          <strong>{scenarioPreview.pessimistic.finalScore}점</strong>
                          <small>{scenarioPreview.pessimistic.workableAge}세까지</small>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="card">
                    <h2>AI 코치 제안</h2>
                    <div className="info-box">
                      <strong>건강 루틴</strong>
                      <p>
                        {state.health < 55
                          ? '건강 지표가 낮아 먼저 수면·운동·회복 루틴 확보가 필요합니다.'
                          : '건강 기반은 양호하므로 유지 전략이 중요합니다.'}
                      </p>
                    </div>
                    <div className="info-box">
                      <strong>AI 역량 강화</strong>
                      <p>
                        {state.adaptability < 60
                          ? '업무 자동화 도구를 직접 사용하는 실습형 학습이 우선입니다.'
                          : '기본 역량은 확보되어 있어, 직무 재설계 수준의 고급 활용이 적합합니다.'}
                      </p>
                    </div>
                    <div className="info-box">
                      <strong>커리어 전략</strong>
                      <p>
                        {state.jobSecurity < 55
                          ? '현재 직무 지속성 리스크가 높아 직무 전환 또는 역할 확장이 필요합니다.'
                          : '현재 직무에서 경쟁력을 유지하되, 리스킬링을 병행하는 전략이 효과적입니다.'}
                      </p>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}

export default App