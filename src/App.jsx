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
      jobSecurity: clamp(
        s.jobSecurity - Math.round((s.aiRisk - s.adaptability * 0.45) / 7),
        0,
        100
      ),
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
  return clamp(
    Math.round(
      healthFactor + jobFactor + adaptFactor + resilienceFactor - penalty + 10
    ),
    0,
    100
  )
}

function estimateWorkableAge(state) {
  const now = state.age
  const bonus = Math.round(
    (state.health +
      state.jobSecurity +
      state.adaptability +
      state.resilience -
      state.stress) /
      18
  )
  return clamp(now + bonus, now, 75)
}

function buildInitialState(form) {
  const job = JOBS[form.job]
  const health = clamp(
    form.health * 20 +
      (form.exercise - 3) * 4 -
      Math.max(0, form.workHours - 45) * 0.5,
    25,
    95
  )
  const adaptability = clamp(
    form.aiSkill * 18 + (form.learningWill - 3) * 5,
    20,
    95
  )
  const stress = clamp(
    job.stressBase +
      Math.max(0, form.workHours - 45) * 0.8 -
      (form.health - 3) * 3,
    20,
    95
  )
  const jobSecurity = clamp(
    100 - job.aiRisk + job.growth * 0.35 + form.aiSkill * 3,
    25,
    95
  )
  const resilience = clamp(
    52 +
      (form.exercise - 3) * 6 +
      (form.learningWill - 3) * 5 -
      Math.max(0, form.workHours - 50) * 0.4,
    20,
    95
  )
  const money = clamp(
    55 + (form.workHours - 40) * 0.9 + (job.growth - 50) * 0.2,
    30,
    90
  )

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

  const event = getYearlyEvent(
    year,
    scenario === 'optimistic' ? 1 : scenario === 'pessimistic' ? 3 : 2
  )
  next = event.apply(next)

  next.jobSecurity = clamp(
    next.jobSecurity +
      Math.round(next.adaptability / 25) -
      Math.round(next.stress / 30),
    0,
    100
  )

  next.health = clamp(
    next.health - Math.max(0, Math.round((next.workHours - 48) / 4)),
    0,
    100
  )

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
    if (log.length <= 1) {
      return <p className="text-sub">아직 연도별 데이터가 없습니다.</p>
    }

    const playableLog = log.slice(1)

    return (
      <div className="section-spacing">
        {playableLog.map((item) => (
          <div
            key={item.turn}
            className="glass-card"
            style={{ padding: '16px', borderRadius: '16px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span>{item.turn}년차</span>
              <span>{item.score}점</span>
            </div>
            <div className="progress-track" style={{ height: '10px' }}>
              <div className="progress-fill" style={{ width: `${item.score}%` }} />
            </div>
            <div className="text-sub" style={{ marginTop: '10px' }}>
              선택: {item.action} / 이벤트: {item.event}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="container section-spacing">
        <div className="centered section-spacing">
          <span className="badge">Simulation Mode</span>
          <h1 className="game-title">AI Career Survival Simulator</h1>
          <p className="subtitle">
            미래 직업 세계에서 살아남기 위한 선택을 시작하세요
          </p>
        </div>

        {phase === 'intro' && (
          <div className="grid two">
            <section className="game-card" style={{ padding: '28px' }}>
              <h2>플레이어 설정</h2>
              <p className="text-sub">
                입력값을 기반으로 초기 건강, 직업 안정성, AI 적응력이 계산됩니다.
              </p>

              <div className="section-spacing" style={{ marginTop: '20px' }}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="이름"
                />

                <input
                  type="number"
                  min="20"
                  max="60"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  placeholder="나이"
                />

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

                <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  <option value="optimistic">낙관 시나리오</option>
                  <option value="baseline">기준 시나리오</option>
                  <option value="pessimistic">비관 시나리오</option>
                </select>

                <label className="text-sub">
                  주당 노동시간
                  <input
                    type="range"
                    min="30"
                    max="70"
                    value={form.workHours}
                    onChange={(e) =>
                      setForm({ ...form, workHours: Number(e.target.value) })
                    }
                  />
                  <div>{form.workHours}시간</div>
                </label>

                <label className="text-sub">
                  주관적 건강 상태
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.health}
                    onChange={(e) => setForm({ ...form, health: Number(e.target.value) })}
                  />
                  <div>{form.health}/5</div>
                </label>

                <label className="text-sub">
                  운동/회복 습관
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.exercise}
                    onChange={(e) =>
                      setForm({ ...form, exercise: Number(e.target.value) })
                    }
                  />
                  <div>{form.exercise}/5</div>
                </label>

                <label className="text-sub">
                  AI 도구 활용 수준
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.aiSkill}
                    onChange={(e) => setForm({ ...form, aiSkill: Number(e.target.value) })}
                  />
                  <div>{form.aiSkill}/5</div>
                </label>

                <label className="text-sub">
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
                  <div>{form.learningWill}/5</div>
                </label>

                <button className="btn-primary" onClick={startGame}>
                  🚀 시뮬레이션 시작
                </button>
              </div>
            </section>

            <section className="game-card" style={{ padding: '28px' }}>
              <h2>게임 목표</h2>

              <div className="section-spacing" style={{ marginTop: '16px' }}>
                <div>
                  <span className="badge">승리 조건</span>
                  <p className="text-sub" style={{ marginTop: '10px' }}>
                    8개 연차 동안 건강과 직업 안정성을 유지하며 높은 점수를 확보합니다.
                  </p>
                </div>

                <div>
                  <span className="badge">실패 조건</span>
                  <p className="text-sub" style={{ marginTop: '10px' }}>
                    건강 또는 직업 안정성이 급격히 악화되면 시뮬레이션이 조기 종료됩니다.
                  </p>
                </div>

                <div>
                  <span className="badge">핵심 전략</span>
                  <p className="text-sub" style={{ marginTop: '10px' }}>
                    단기 성과만 올리면 후반부에 무너질 수 있습니다. 균형이 중요합니다.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {phase !== 'intro' && state && (
          <div className="grid two">
            <section className="game-card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <h2>현재 상태</h2>
                <button className="btn-secondary" onClick={restart}>
                  처음부터 다시
                </button>
              </div>

              <div className="section-spacing">
                <div className="badge">
                  {state.name} · {state.jobLabel}
                </div>

                <div className="text-sub">현재 나이 {state.age}세</div>
                <div className="text-sub">지속가능성 점수 {currentScore}점</div>
                <div className="text-sub">예상 근로 가능 연령 {workableAge}세</div>

                <ProgressBar label="건강" value={state.health} />
                <ProgressBar label="직업 안정성" value={state.jobSecurity} />
                <ProgressBar label="AI 적응력" value={state.adaptability} />
                <ProgressBar label="회복탄력성" value={state.resilience} />
                <ProgressBar label="경제적 자원" value={state.money} />
                <ProgressBar label="스트레스" value={state.stress} danger />

                {lastEvent && (
                  <div
                    className="glass-card"
                    style={{ padding: '18px', borderRadius: '18px' }}
                  >
                    <div className="badge" style={{ marginBottom: '10px' }}>
                      Recent Event
                    </div>
                    <h3 style={{ marginBottom: '8px' }}>{lastEvent.title}</h3>
                    <p className="text-sub">{lastEvent.text}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="game-card" style={{ padding: '24px' }}>
              {phase === 'play' && (
                <div className="section-spacing">
                  <div>
                    <h2>{turn}년차 의사결정</h2>
                    <p className="text-sub" style={{ marginTop: '10px' }}>
                      현재 시나리오:{' '}
                      {scenario === 'optimistic'
                        ? '낙관'
                        : scenario === 'baseline'
                          ? '기준'
                          : '비관'}
                    </p>
                  </div>

                  <div className="section-spacing">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.key}
                        className={`choice-card choice-${action.key}`}
                        onClick={() => playTurn(action.key)}
                      >
                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          {action.title}
                        </div>
                        <div className="text-sub" style={{ marginTop: '8px' }}>
                          {action.desc}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginTop: '12px',
                          }}
                        >
                          {Object.entries(action.effect).map(([k, v]) => (
                            <span key={k} className="badge">
                              {k} {v > 0 ? `+${v}` : v}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <h3 style={{ marginBottom: '12px' }}>플레이 로그</h3>
                    <div className="section-spacing">
                      {log.slice(1).reverse().map((item) => (
                        <div
                          key={item.turn}
                          className="glass-card"
                          style={{ padding: '16px', borderRadius: '16px' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <strong>
                              {item.turn}년차 · {item.action}
                            </strong>
                            <span className="text-sub">{item.score}점</span>
                          </div>
                          <div className="text-sub" style={{ marginTop: '8px' }}>
                            이벤트: {item.event}
                          </div>
                        </div>
                      ))}
                      {log.length === 1 && (
                        <p className="text-sub">아직 로그가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {phase === 'result' && (
                <div className="section-spacing">
                  <div>
                    <h2>최종 리포트</h2>
                    <p className="text-sub" style={{ marginTop: '10px' }}>
                      당신의 커리어 시뮬레이션 결과입니다.
                    </p>
                  </div>

                  <div className="section-spacing">
                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        Final Score
                      </div>
                      <h3>{currentScore}점</h3>
                    </div>

                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        Workable Age
                      </div>
                      <h3>{workableAge}세</h3>
                    </div>

                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        종합 판정
                      </div>
                      <h3>
                        {currentScore >= 75
                          ? '안정적'
                          : currentScore >= 55
                            ? '관리 필요'
                            : '고위험'}
                      </h3>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: '12px' }}>연도별 변화</h3>
                    {renderLineBars()}
                  </div>

                  {scenarioPreview && (
                    <div className="section-spacing">
                      <h3>시나리오 비교</h3>

                      <div
                        className="glass-card"
                        style={{ padding: '18px', borderRadius: '18px' }}
                      >
                        <div className="badge" style={{ marginBottom: '10px' }}>
                          낙관 시나리오
                        </div>
                        <div>{scenarioPreview.optimistic.finalScore}점</div>
                        <div className="text-sub">
                          {scenarioPreview.optimistic.workableAge}세까지
                        </div>
                      </div>

                      <div
                        className="glass-card"
                        style={{ padding: '18px', borderRadius: '18px' }}
                      >
                        <div className="badge" style={{ marginBottom: '10px' }}>
                          기준 시나리오
                        </div>
                        <div>{scenarioPreview.baseline.finalScore}점</div>
                        <div className="text-sub">
                          {scenarioPreview.baseline.workableAge}세까지
                        </div>
                      </div>

                      <div
                        className="glass-card"
                        style={{ padding: '18px', borderRadius: '18px' }}
                      >
                        <div className="badge" style={{ marginBottom: '10px' }}>
                          비관 시나리오
                        </div>
                        <div>{scenarioPreview.pessimistic.finalScore}점</div>
                        <div className="text-sub">
                          {scenarioPreview.pessimistic.workableAge}세까지
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="btn-primary" onClick={restart}>
                    다시 플레이
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default App