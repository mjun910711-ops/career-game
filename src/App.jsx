import { useMemo, useRef, useState } from 'react'
import './App.css'

const JOBS = {
  office: {
    label: '사무/기획',
    aiRisk: 72,
    bodyLoad: 35,
    stressBase: 62,
    growth: 50,
    expectedWorkableAge: 61,
    description:
      '문서, 보고, 조율 업무 비중이 높아 AI 자동화 영향이 빠르게 반영됩니다.',
  },
  developer: {
    label: '개발/IT',
    aiRisk: 54,
    bodyLoad: 28,
    stressBase: 66,
    growth: 72,
    expectedWorkableAge: 64,
    description:
      'AI 보조를 잘 활용하면 생산성이 커지지만, 학습 압박도 함께 커집니다.',
  },
  healthcare: {
    label: '의료/돌봄',
    aiRisk: 26,
    bodyLoad: 66,
    stressBase: 58,
    growth: 69,
    expectedWorkableAge: 67,
    description:
      '대면 상호작용과 현장 대응력이 중요해 AI 대체 리스크는 낮습니다.',
  },
  manufacturing: {
    label: '제조/현장',
    aiRisk: 48,
    bodyLoad: 74,
    stressBase: 55,
    growth: 57,
    expectedWorkableAge: 60,
    description:
      '자동화 리스크와 신체 부담이 동시에 존재하는 직군입니다.',
  },
  service: {
    label: '서비스/영업',
    aiRisk: 44,
    bodyLoad: 46,
    stressBase: 64,
    growth: 60,
    expectedWorkableAge: 62,
    description:
      '감정노동과 실적 압박이 크며, 일부 업무는 AI로 빠르게 전환됩니다.',
  },
}

const SCENARIOS = {
  optimistic: '낙관 시나리오',
  baseline: '기준 시나리오',
  pessimistic: '비관 시나리오',
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

function getJudgement(score) {
  if (score >= 80) {
    return {
      label: '매우 안정적',
      message: '건강, 적응력, 직업 안정성이 균형 있게 유지되고 있습니다.',
    }
  }
  if (score >= 65) {
    return {
      label: '안정적',
      message: '지속 가능성이 양호하지만 특정 리스크 관리가 필요합니다.',
    }
  }
  if (score >= 50) {
    return {
      label: '관리 필요',
      message: '현재 구조를 유지하면 후반부에 피로 또는 불안정성이 커질 수 있습니다.',
    }
  }
  return {
    label: '고위험',
    message: '건강 또는 직업 안정성이 빠르게 악화되고 있어 전략 수정이 필요합니다.',
  }
}

function getAgeGapLabel(diff) {
  if (diff >= 6) return '직군 평균 대비 매우 긍정적'
  if (diff >= 2) return '직군 평균 대비 우세'
  if (diff >= -1) return '직군 평균 수준'
  if (diff >= -5) return '직군 평균 대비 낮음'
  return '직군 평균 대비 크게 낮음'
}

function getCharacterImage(state, useBaseOnly = false) {
  if (state.gender === 'none') {
    return '/characters/neutral-base.png'
  }

  const genderPrefix = state.gender === 'female' ? 'female' : 'male'

  if (useBaseOnly) {
    return `/characters/${genderPrefix}-base.png`
  }

  const jobImageMap = {
    office: 'office',
    developer: 'it',
    healthcare: 'medical',
    manufacturing: 'manufacturing',
    service: 'service',
  }

  const jobSuffix = jobImageMap[state.jobKey]

  if (!jobSuffix) {
    return `/characters/${genderPrefix}-base.png`
  }

  return `/characters/${genderPrefix}-${jobSuffix}.png`
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
    gender: form.gender,
    jobKey: form.job,
    jobLabel: job.label,
    aiRisk: job.aiRisk,
    bodyLoad: job.bodyLoad,
    expectedWorkableAge: job.expectedWorkableAge,
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

function buildDelta(previous, next) {
  return {
    health: Math.round((next.health - previous.health) * 10) / 10,
    jobSecurity: Math.round((next.jobSecurity - previous.jobSecurity) * 10) / 10,
    adaptability: Math.round((next.adaptability - previous.adaptability) * 10) / 10,
    resilience: Math.round((next.resilience - previous.resilience) * 10) / 10,
    money: Math.round((next.money - previous.money) * 10) / 10,
    stress: Math.round((next.stress - previous.stress) * 10) / 10,
  }
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

function getPriorityLabel(state) {
  const priorities = [
    {
      key: 'health',
      label: '건강 회복',
      value: 100 - state.health + Math.max(0, state.stress - 60),
    },
    {
      key: 'ai',
      label: 'AI 적응력 강화',
      value: 100 - state.adaptability + Math.max(0, state.aiRisk - 45),
    },
    {
      key: 'job',
      label: '직업 안정성 보완',
      value: 100 - state.jobSecurity + Math.max(0, state.aiRisk - 40),
    },
    {
      key: 'stress',
      label: '스트레스 관리',
      value: state.stress + Math.max(0, state.workHours - 50) * 2,
    },
  ]

  priorities.sort((a, b) => b.value - a.value)
  return priorities[0]?.label || '균형 유지'
}

function getStrengthLabel(state) {
  const strengths = [
    { label: '건강 체력 기반', value: state.health },
    { label: 'AI 적응력', value: state.adaptability },
    { label: '직업 안정성', value: state.jobSecurity },
    { label: '회복탄력성', value: state.resilience },
  ]

  strengths.sort((a, b) => b.value - a.value)
  return strengths[0]?.label || '기본 체력'
}

function getCareerType(state) {
  if (state.adaptability >= 70 && state.jobSecurity >= 65) {
    return 'AI 적응형 생존자'
  }
  if (state.health >= 70 && state.resilience >= 65) {
    return '장기 지속형 안정자'
  }
  if (state.stress >= 70) {
    return '과부하 위험형'
  }
  if (state.jobSecurity <= 50) {
    return '불안정 전환형'
  }
  return '균형 유지형'
}

function getRecommendedAction(state) {
  const candidates = [
    {
      key: 'health',
      title: '건강 루틴 재정비',
      score: (100 - state.health) + Math.max(0, state.stress - 55),
    },
    {
      key: 'ai',
      title: 'AI 도구 실전 활용',
      score: (100 - state.adaptability) + Math.max(0, state.aiRisk - 45),
    },
    {
      key: 'balance',
      title: '업무 강도 조절',
      score: state.stress + Math.max(0, state.workHours - 48) * 2,
    },
    {
      key: 'pivot',
      title: '직무 확장 준비',
      score: (100 - state.jobSecurity) + Math.max(0, state.aiRisk - 50),
    },
  ]

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.title || '균형 유지'
}

function buildGuideCards(state, ageGap) {
  const cards = []

  if (state.health <= 60 || state.stress >= 65) {
    cards.push({
      category: '건강 관리',
      title: '회복 루틴을 먼저 복구하세요',
      body: '수면, 운동, 피로 관리가 무너지면 근로가능연령이 가장 먼저 짧아집니다.',
      effect: '기대 효과 · 체력 유지와 후반부 이탈 리스크 감소',
    })
  } else {
    cards.push({
      category: '건강 관리',
      title: '현재 체력 우위를 유지하세요',
      body: '지금의 건강 상태는 강점입니다. 무리한 업무 몰입보다 지속 가능한 루틴 유지가 더 중요합니다.',
      effect: '기대 효과 · 중장기 근속 가능성 방어',
    })
  }

  if (state.adaptability <= 65 || state.aiRisk >= 55) {
    cards.push({
      category: '역량 업그레이드',
      title: 'AI를 피하지 말고 업무 방식에 넣으세요',
      body: '반복업무 자동화, 문서 초안, 분석 보조 등 바로 쓰는 방식으로 익숙해지는 것이 중요합니다.',
      effect: '기대 효과 · 자동화 리스크 완충, 직무 경쟁력 상승',
    })
  } else {
    cards.push({
      category: '역량 업그레이드',
      title: 'AI 활용을 심화 단계로 올리세요',
      body: '단순 사용에서 끝내지 말고, 실제 성과를 내는 업무 프로세스까지 연결해보세요.',
      effect: '기대 효과 · 생산성 우위 확대',
    })
  }

  if (state.jobSecurity <= 60 || ageGap < 0) {
    cards.push({
      category: '커리어 전략',
      title: '현재 직무 옆의 역할까지 확장 준비가 필요합니다',
      body: '한 직무에만 머무르기보다, 인접 역할이나 관리·기획 기능까지 연결할 준비를 해두는 것이 유리합니다.',
      effect: '기대 효과 · 직업 안정성 회복, 시장 변화 대응력 확보',
    })
  } else {
    cards.push({
      category: '커리어 전략',
      title: '강점을 기반으로 역할 폭을 넓히세요',
      body: '현재 결과가 양호하더라도 향후 변화에 대비해 직무 확장형 성장 경로를 설계해두는 것이 좋습니다.',
      effect: '기대 효과 · 평균 이상 커리어 지속성 유지',
    })
  }

  if (state.stress >= 68 || state.workHours >= 55) {
    cards.push({
      category: '일하는 방식',
      title: '성과보다 지속 가능성을 먼저 설계하세요',
      body: '노동시간을 줄이거나 업무 우선순위를 재정렬해 피로 누적 구조를 끊는 것이 중요합니다.',
      effect: '기대 효과 · 번아웃 리스크 완화, 후반 생존력 개선',
    })
  } else {
    cards.push({
      category: '일하는 방식',
      title: '현재의 균형을 무너뜨리지 마세요',
      body: '근로가능연령을 늘리는 핵심은 한 번의 몰입보다 오래 유지되는 효율 구조입니다.',
      effect: '기대 효과 · 안정적 점수 유지',
    })
  }

  return cards
}

function buildGuideData(state, currentScore, workableAge, jobExpectedAge) {
  const ageGap = workableAge - jobExpectedAge
  const judgement = getJudgement(currentScore)

  return {
    summary: {
      priority: getPriorityLabel(state),
      strength: getStrengthLabel(state),
      recommendation: getRecommendedAction(state),
      ageGap,
      judgement,
    },
    cards: buildGuideCards(state, ageGap),
  }
}

function getProgressTone(value, danger = false) {
  const numericValue = Number(value)

  if (danger) {
    if (numericValue >= 65) return 'danger'
    if (numericValue >= 35) return 'warning'
    return 'safe'
  }

  if (numericValue <= 34) return 'danger'
  if (numericValue <= 64) return 'warning'
  return 'safe'
}

function getRiskBadges(state) {
  if (!state) return []

  const badges = []

  if (state.health <= 34) badges.push('건강 위험')
  if (state.jobSecurity <= 34) badges.push('직업 안정성 위험')
  if (state.adaptability <= 34) badges.push('AI 적응력 부족')
  if (state.resilience <= 34) badges.push('회복탄력성 저하')
  if (state.money <= 34) badges.push('경제적 여력 부족')
  if (state.stress >= 65) badges.push('스트레스 과다')
  if (state.workHours >= 55) badges.push('과로 구간')

  return badges
}

function getGuideAgeTone(ageGap) {
  if (ageGap >= 2) return 'positive'
  if (ageGap >= -1) return 'neutral'
  return 'negative'
}

function getGuideSummaryTone(type) {
  if (type === 'priority') return 'warning'
  if (type === 'strength') return 'safe'
  return 'accent'
}

function getEffectLabelMap() {
  return {
    health: '건강',
    adaptability: 'AI 적응력',
    money: '경제적 자원',
    stress: '스트레스',
    resilience: '회복탄력성',
  }
}

function formatActionFeedback(effect) {
  const labelMap = getEffectLabelMap()

  return Object.entries(effect)
    .map(([key, value]) => ({
      key,
      label: labelMap[key] || key,
      value,
      isPositive:
        key === 'stress'
          ? value < 0
          : value > 0,
    }))
}

async function copyCurrentUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    alert('링크가 복사되었습니다!')
  } catch (error) {
    const temp = document.createElement('textarea')
    temp.value = window.location.href
    document.body.appendChild(temp)
    temp.select()
    document.execCommand('copy')
    document.body.removeChild(temp)
    alert('링크가 복사되었습니다!')
  }
}

function ProgressBar({ label, value, danger = false }) {
  const tone = getProgressTone(value, danger)
  const displayValue = Number.isInteger(value) ? value : value.toFixed(1)

  return (
    <div className="progress-group">
      <div className="progress-label">
        <span>{label}</span>
        <span className={`progress-value ${tone}`}>{displayValue}</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${tone}`}
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  )
}

function CharacterPanel({ state, currentScore, workableAge, useBaseOnly = false }) {
  const genderLabel =
    state.gender === 'female'
      ? '여성'
      : state.gender === 'male'
        ? '남성'
        : '미선택'

  return (
    <div className="character-stage">
      <div
        className={`character-portrait ${state.gender} ${state.jobKey} ${
          state.stress >= 70 ? 'is-danger' : ''
        }`}
      >
        <div className="character-portrait-top">
          <span className="character-job-label">{state.jobLabel}</span>
          <span className="character-aura">{useBaseOnly ? '준비 상태' : '진행 상태'}</span>
        </div>

        <div className="character-avatar-wrap">
          <img
            className="character-avatar-image"
            src={getCharacterImage(state, useBaseOnly)}
            alt="캐릭터"
          />
        </div>

        <div className="character-nameplate">
          <strong>{state.name}</strong>
          <span>{genderLabel}</span>
        </div>
      </div>

      <div className="character-summary glass-card">
        <div className="badge" style={{ marginBottom: '10px' }}>
          Player Status
        </div>
        <div className="text-sub">{state.jobLabel}</div>
        <div className="text-sub">현재 나이 {state.age}세</div>
        <div className="text-sub">지속가능성 점수 {currentScore}점</div>
        <div className="text-sub">예상 근로 가능 연령 {workableAge}세</div>
      </div>
    </div>
  )
}

function GuideModal({
  open,
  onClose,
  guideData,
  workableAge,
  jobExpectedAge,
  onShare,
  onRestart,
}) {
  if (!open || !guideData) return null

  const { summary, cards } = guideData

  const ageTone = getGuideAgeTone(summary.ageGap)

  return (
    <div className="guide-modal-overlay" onClick={onClose}>
      <div className="guide-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="guide-modal-header">
          <div>
            <div className="badge" style={{ marginBottom: '10px' }}>
              Improvement Guide
            </div>
            <h2 className="guide-modal-title">근로가능연령 늘리기 가이드</h2>
            <p className="text-sub guide-modal-subtitle">
              현재 결과를 기준으로, 커리어 지속가능성을 높이기 위한 우선 개선 포인트를 정리했어요.
            </p>
          </div>

          <button type="button" className="guide-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="guide-hero-card">
          <div className={`guide-hero-main guide-hero-main-${ageTone}`}>
            <div className="guide-hero-label">예상 근로 가능 연령</div>
            <div className="guide-hero-age">
              {workableAge}
              <span>세</span>
            </div>
            <div className="guide-hero-meta">
              직군 기대 연령 {jobExpectedAge}세 · 차이{' '}
              <strong className={`guide-age-gap guide-age-gap-${ageTone}`}>
                {summary.ageGap >= 0 ? '+' : ''}
                {summary.ageGap}세
              </strong>
            </div>
          </div>

          <div className="guide-hero-side">
            <div className={`guide-mini-card guide-mini-card-${getGuideSummaryTone('priority')}`}>
              <span className="badge" style={{ marginBottom: '8px' }}>
                가장 시급한 개선 영역
              </span>
              <strong>{summary.priority}</strong>
            </div>

            <div className={`guide-mini-card guide-mini-card-${getGuideSummaryTone('strength')}`}>
              <span className="badge" style={{ marginBottom: '8px' }}>
                현재 강점
              </span>
              <strong>{summary.strength}</strong>
            </div>

            <div className={`guide-mini-card guide-mini-card-${getGuideSummaryTone('recommendation')}`}>
              <span className="badge" style={{ marginBottom: '8px' }}>
                우선 실행 추천
              </span>
              <strong>{summary.recommendation}</strong>
            </div>
          </div>
        </div>

        <div className="guide-judgement-bar">
          <strong>{summary.judgement.label}</strong>
          <span>{summary.judgement.message}</span>
        </div>

        <div className="guide-card-grid">
          {cards.map((card, index) => (
            <div key={`${card.category}-${index}`} className="guide-content-card">
              <div className="guide-card-topline">
                <span className="badge">우선순위 {index + 1}</span>
                <span className="guide-card-category">{card.category}</span>
              </div>

              <h3>{card.title}</h3>
              <p className="text-sub" style={{ marginTop: '10px' }}>
                {card.body}
              </p>
              <div className="guide-effect-text">{card.effect}</div>
            </div>
          ))}
        </div>

        <div className="guide-modal-actions">
          <button className="result-action-btn" onClick={onShare}>
            📤 친구에게 공유하기
          </button>
          <button className="btn-primary" onClick={onRestart}>
            다시 플레이
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [phase, setPhase] = useState('intro')
  const [form, setForm] = useState({
    name: '',
    age: 30,
    gender: 'none',
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
  const [showGuide, setShowGuide] = useState(false)
  const [actionFeedback, setActionFeedback] = useState(null)
  const [turnFeedback, setTurnFeedback] = useState(null)

  const nameInputRef = useRef(null)
  const [nameError, setNameError] = useState(false)

  const genderSectionRef = useRef(null)
  const [genderError, setGenderError] = useState(false)

  const maxTurns = 8

  const introPreviewState = useMemo(() => buildInitialState(form), [form])
  const introPreviewScore = useMemo(
    () => scoreCareer(introPreviewState),
    [introPreviewState]
  )
  const introPreviewWorkableAge = useMemo(
    () => estimateWorkableAge(introPreviewState),
    [introPreviewState]
  )

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

  const jobExpectedAge = state
    ? JOBS[state.jobKey]?.expectedWorkableAge ?? 62
    : JOBS[form.job]?.expectedWorkableAge ?? 62

  const ageGap = workableAge - jobExpectedAge
  const judgement = getJudgement(currentScore)

  const guideData = useMemo(() => {
    if (!state || phase !== 'result') return null
    return buildGuideData(state, currentScore, workableAge, jobExpectedAge)
  }, [state, phase, currentScore, workableAge, jobExpectedAge])
  
  const riskBadges = useMemo(() => getRiskBadges(state), [state])

  const startGame = () => {
    if (!form.name.trim()) {
      setNameError(true)

      requestAnimationFrame(() => {
        nameInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        nameInputRef.current?.focus()
      })

      return
    }

    if (form.gender === 'none') {
      setGenderError(true)

      requestAnimationFrame(() => {
        genderSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })

      return
    }

    const initial = buildInitialState(form)
    setState(initial)
    setTurn(1)
    setShowGuide(false)
    setNameError(false)
    setGenderError(false)
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

    // ✅ STEP1 → STEP2 전환 시 스크롤
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
  }

  const playTurn = (actionKey) => {
    const previousState = { ...state }
    const result = simulateOneStep(state, actionKey, scenario, turn)
    const delta = buildDelta(previousState, result.next)

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
        delta,
      },
    ])

    setTurnFeedback({
      turn,
      action: result.action.title,
      event: result.event.title,
      delta,
    })

    setTimeout(() => {
      setTurnFeedback(null)
    }, 2200)

    if (turn >= maxTurns || result.next.health <= 15 || result.next.jobSecurity <= 15) {
      setPhase('result')

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
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
    setShowGuide(false)
    setTurnFeedback(null)
  }

  const renderLineBars = () => {
  if (log.length <= 1) {
    return <p className="text-sub">아직 연도별 데이터가 없습니다.</p>
  }

  const playableLog = log.slice(1)

  return (
    <div className="section-spacing">
      {playableLog.map((item) => {
        const tone = getProgressTone(item.score)

        return (
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
              <span className={`progress-value ${tone}`}>{item.score}점</span>
            </div>

            <div className="progress-track" style={{ height: '10px' }}>
              <div
                className={`progress-fill ${tone}`}
                style={{ width: `${Math.max(0, Math.min(item.score, 100))}%` }}
              />
            </div>

            <div className="text-sub" style={{ marginTop: '10px' }}>
              선택: {item.action} / 이벤트: {item.event}
            </div>

            {item.delta && getDeltaItems(item.delta).length > 0 && (
              <div className="turn-delta">
                {getDeltaItems(item.delta).map((deltaItem) => (
                  <span
                    key={deltaItem.key}
                    className={`delta-chip ${deltaItem.value > 0 ? 'plus' : 'minus'}`}
                  >
                    {deltaItem.label} {deltaItem.value > 0 ? '+' : ''}
                    {deltaItem.value}
                  </span>
                ))}
              </div>
            )}

          </div>
        )
      })}
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

          <div className="step-indicator">
            <span className={`badge step-badge ${phase === 'intro' ? 'active-step' : ''}`}>
              STEP 1 정보 입력
            </span>
            <span className={`badge step-badge ${phase === 'play' ? 'active-step' : ''}`}>
              STEP 2 8년 시뮬레이션
            </span>
            <span className={`badge step-badge ${phase === 'result' ? 'active-step' : ''}`}>
              STEP 3 최종 리포트
            </span>
          </div>
        </div>

        {phase === 'intro' && (
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
                <span className="badge">캐릭터 미리보기</span>
              </div>

              <div className="section-spacing">
                <CharacterPanel
                  state={introPreviewState}
                  currentScore={introPreviewScore}
                  workableAge={introPreviewWorkableAge}
                  useBaseOnly={true}
                />

                <ProgressBar label="건강" value={introPreviewState.health} />
                <ProgressBar label="직업 안정성" value={introPreviewState.jobSecurity} />
                <ProgressBar label="AI 적응력" value={introPreviewState.adaptability} />
                <ProgressBar label="회복탄력성" value={introPreviewState.resilience} />
                <ProgressBar label="경제적 자원" value={introPreviewState.money} />
                <ProgressBar label="스트레스" value={introPreviewState.stress} danger />

                <div
                  className="glass-card"
                  style={{ padding: '18px', borderRadius: '18px' }}
                >
                  <div className="badge" style={{ marginBottom: '10px' }}>
                    현재 설정 요약
                  </div>
                  <p className="text-sub">
                    성별을 선택하기 전에는 중립형 캐릭터가 표시되고, 남성 또는 여성을 선택하면 해당 기본 캐릭터로 전환됩니다.
                  </p>
                  <p className="text-sub" style={{ marginTop: '8px' }}>
                    선택 직군: {JOBS[form.job].label}
                  </p>
                  <p className="text-sub" style={{ marginTop: '8px' }}>
                    선택 성별:{' '}
                    {form.gender === 'none'
                      ? '미선택'
                      : form.gender === 'male'
                        ? '남성'
                        : '여성'}
                  </p>
                  <p className="text-sub" style={{ marginTop: '8px' }}>
                    시나리오: {SCENARIOS[scenario]}
                  </p>
                  <p className="text-sub" style={{ marginTop: '8px' }}>
                    직군 기대 근로 가능 연령: {JOBS[form.job].expectedWorkableAge}세
                  </p>
                </div>
              </div>
            </section>

            <section className="game-card" style={{ padding: '28px' }}>
              <h2>플레이어 설정</h2>
              <p className="text-sub">
                입력값을 기반으로 초기 건강, 직업 안정성, AI 적응력이 계산됩니다.
              </p>
              <p className="intro-hook">
                AI 시대, 당신은 몇 살까지 일할 수 있을까요?
              </p>

              <div className="section-spacing" style={{ marginTop: '20px' }}>
                <label className="input-field">
                  <span className="input-field-label required-label">
                    이름 <em>*</em>
                  </span>
                  <input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      if (e.target.value.trim()) {
                        setNameError(false)
                      }
                    }}
                    placeholder="이름을 입력하세요"
                    className={nameError ? 'input-error' : ''}
                  />
                  {nameError && (
                    <span className="field-error-text">이름은 필수 입력 항목입니다.</span>
                  )}
                </label>

                <label className="input-field">
                  <span className="input-field-label">나이</span>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    placeholder="나이를 입력하세요"
                  />
                </label>

                <div className="field-group" ref={genderSectionRef}>
                  <span className="input-field-label required-label">
                    성별 <em>*</em>
                  </span>

                  <div className={`gender-select ${genderError ? 'field-group-error' : ''}`}>
                    <button
                      type="button"
                      className={`gender-option ${form.gender === 'none' ? 'active' : ''}`}
                      onClick={() => {
                        setForm({ ...form, gender: 'none' })
                      }}
                    >
                      미선택
                    </button>
                    <button
                      type="button"
                      className={`gender-option ${form.gender === 'male' ? 'active' : ''}`}
                      onClick={() => {
                        setForm({ ...form, gender: 'male' })
                        setGenderError(false)
                      }}
                    >
                      남성
                    </button>
                    <button
                      type="button"
                      className={`gender-option ${form.gender === 'female' ? 'active' : ''}`}
                      onClick={() => {
                        setForm({ ...form, gender: 'female' })
                        setGenderError(false)
                      }}
                    >
                      여성
                    </button>
                  </div>

                  {genderError && (
                    <span className="field-error-text">성별은 필수 선택 항목입니다.</span>
                  )}
                </div>

                <div className="field-group">
                  <span className="input-field-label">직군</span>
                  <div className="option-select">
                    {Object.entries(JOBS).map(([key, job]) => (
                      <button
                        key={key}
                        type="button"
                        className={`option-button ${form.job === key ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, job: key })}
                      >
                        {job.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <span className="input-field-label">시나리오</span>
                  <div className="option-select">
                    {Object.entries(SCENARIOS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`option-button ${scenario === key ? 'active' : ''}`}
                        onClick={() => setScenario(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="slider-field">
                  <div className="slider-header">
                    <div className="slider-title-wrap">
                      <span className="slider-title">주당 노동시간</span>
                      <span className="slider-caption">현재 나의 업무 강도를 입력해보세요</span>
                    </div>
                    <span className="slider-current">{form.workHours}시간</span>
                  </div>

                  <div className="slider-control-wrap">
                    <input
                      className="slider-range"
                      type="range"
                      min="20"
                      max="70"
                      step="5"
                      value={form.workHours}
                      onChange={(e) =>
                        setForm({ ...form, workHours: Number(e.target.value) })
                      }
                    />

                    <div className="slider-scale scale-6">
                      <span>20</span>
                      <span>30</span>
                      <span>40</span>
                      <span>50</span>
                      <span>60</span>
                      <span>70</span>
                    </div>

                    <div className="slider-range-hint">
                      <span><strong>낮음</strong> · 여유 있는 편</span>
                      <span><strong>높음</strong> · 과로 위험</span>
                    </div>
                  </div>
                </label>

                <label className="slider-field">
                  <div className="slider-header">
                    <div className="slider-title-wrap">
                      <span className="slider-title">주관적 건강 상태</span>
                      <span className="slider-caption">현재 체력과 컨디션 수준</span>
                    </div>
                    <span className="slider-current">{form.health}/5</span>
                  </div>

                  <div className="slider-control-wrap">
                    <input
                      className="slider-range"
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.health}
                      onChange={(e) =>
                        setForm({ ...form, health: Number(e.target.value) })
                      }
                    />

                    <div className="slider-scale scale-5">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    <div className="slider-range-hint">
                      <span><strong>낮음</strong> · 관리 필요</span>
                      <span><strong>높음</strong> · 매우 양호</span>
                    </div>
                  </div>
                </label>

                <label className="slider-field">
                  <div className="slider-header">
                    <div className="slider-title-wrap">
                      <span className="slider-title">운동/회복 습관</span>
                      <span className="slider-caption">수면, 운동, 회복 루틴의 안정성</span>
                    </div>
                    <span className="slider-current">{form.exercise}/5</span>
                  </div>

                  <div className="slider-control-wrap">
                    <input
                      className="slider-range"
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.exercise}
                      onChange={(e) =>
                        setForm({ ...form, exercise: Number(e.target.value) })
                      }
                    />

                    <div className="slider-scale scale-5">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    <div className="slider-range-hint">
                      <span><strong>낮음</strong> · 불규칙한 편</span>
                      <span><strong>높음</strong> · 매우 안정적</span>
                    </div>
                  </div>
                </label>

                <label className="slider-field">
                  <div className="slider-header">
                    <div className="slider-title-wrap">
                      <span className="slider-title">AI 도구 활용 수준</span>
                      <span className="slider-caption">업무에 AI를 얼마나 실전적으로 활용하는지</span>
                    </div>
                    <span className="slider-current">{form.aiSkill}/5</span>
                  </div>

                  <div className="slider-control-wrap">
                    <input
                      className="slider-range"
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.aiSkill}
                      onChange={(e) =>
                        setForm({ ...form, aiSkill: Number(e.target.value) })
                      }
                    />

                    <div className="slider-scale scale-5">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    <div className="slider-range-hint">
                      <span><strong>낮음</strong> · 거의 사용 안 함</span>
                      <span><strong>높음</strong> · 업무에 적극 활용</span>
                    </div>
                  </div>
                </label>

                <label className="slider-field">
                  <div className="slider-header">
                    <div className="slider-title-wrap">
                      <span className="slider-title">재교육 의지</span>
                      <span className="slider-caption">새로운 기술과 역할을 배우려는 의지</span>
                    </div>
                    <span className="slider-current">{form.learningWill}/5</span>
                  </div>

                  <div className="slider-control-wrap">
                    <input
                      className="slider-range"
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.learningWill}
                      onChange={(e) =>
                        setForm({ ...form, learningWill: Number(e.target.value) })
                      }
                    />

                    <div className="slider-scale scale-5">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>

                    <div className="slider-range-hint">
                      <span><strong>낮음</strong> · 변화 저항 큼</span>
                      <span><strong>높음</strong> · 학습 의지 강함</span>
                    </div>
                  </div>
                </label>

                <div
                  className="glass-card"
                  style={{ padding: '18px', borderRadius: '18px' }}
                >
                  <div className="badge" style={{ marginBottom: '10px' }}>
                    게임 목표
                  </div>
                  <p className="text-sub">
                    8개 연차 동안 건강과 직업 안정성을 유지하며 높은 점수를 확보합니다.
                  </p>
                </div>

                <div
                  className="glass-card"
                  style={{ padding: '18px', borderRadius: '18px' }}
                >
                  <div className="badge" style={{ marginBottom: '10px' }}>
                    실패 조건
                  </div>
                  <p className="text-sub">
                    건강 또는 직업 안정성이 급격히 악화되면 시뮬레이션이 조기 종료됩니다.
                  </p>
                </div>

                <div
                  className="glass-card"
                  style={{ padding: '18px', borderRadius: '18px' }}
                >
                  <div className="badge" style={{ marginBottom: '10px' }}>
                    핵심 전략
                  </div>
                  <p className="text-sub">
                    단기 성과만 올리면 후반부에 무너질 수 있습니다. 균형이 중요합니다.
                  </p>
                </div>

                <button className="btn-primary" onClick={startGame}>
                  🚀 시뮬레이션 시작
                </button>
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
                <CharacterPanel
                  state={state}
                  currentScore={currentScore}
                  workableAge={workableAge}
                />

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
                  <div className="play-header-block">
                    <h2>{turn}년차 전략 선택</h2>

                    <div className="play-status-row">
                      <div className="play-status-card">
                        <span className="play-status-label">현재 시나리오</span>
                        <strong>{SCENARIOS[scenario]}</strong>
                      </div>

                      <div className="play-status-card">
                        <span className="play-status-label">진행 현황</span>
                        <strong>{turn}/{maxTurns}</strong>
                      </div>
                    </div>

                    <div className="play-message-box">
                      <p>
                        총 <strong>8년</strong> 동안 매년 <strong>하나의 전략</strong>만 선택하며
                        커리어 미래를 시뮬레이션합니다.
                      </p>
                      <p>
                        아래 선택지는 해당 연도에 집중할 행동 전략이며, 선택 즉시
                        <strong> 건강 · 적응력 · 스트레스 · 소득</strong> 등에 반영됩니다.
                      </p>
                    </div>
                  </div>

                  {actionFeedback && (
                    <div className="action-feedback-box">
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        선택 효과
                      </div>

                      <div className="action-feedback-list">
                        {actionFeedback.map((item) => (
                          <span
                            key={item.key}
                            className={`action-feedback-chip ${item.isPositive ? 'positive' : 'negative'}`}
                          >
                            {item.label} {item.value > 0 ? `+${item.value}` : item.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="glass-card play-guide"
                    style={{
                      padding: '18px',
                      borderRadius: '18px',
                      background:
                        'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))',
                      border: '1px solid rgba(110, 231, 255, 0.32)',
                      boxShadow: '0 0 0 1px rgba(110, 231, 255, 0.08)',
                    }}
                  >
                    <div className="badge" style={{ marginBottom: '10px' }}>
                      플레이 방법
                    </div>
                    <p
                      className="text-sub"
                      style={{
                        color: '#f8fbff',
                        fontWeight: 600,
                        fontSize: '1.02rem',
                        lineHeight: 1.8,
                        opacity: 1,
                      }}
                    >
                      매년 하나의 전략만 선택할 수 있습니다.
                    </p>
                    <p
                      className="text-sub"
                      style={{
                        marginTop: '6px',
                        color: '#f8fbff',
                        fontWeight: 600,
                        fontSize: '1.02rem',
                        lineHeight: 1.8,
                        opacity: 1,
                      }}
                    >
                      선택한 전략은 해당 연도의 상태 변화와 결과에 반영됩니다.
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
                      {log.slice(1).reverse().map((item) => {
                        const deltaItems = getDeltaItems(item.delta)

                        return (
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

                            {deltaItems.length > 0 && (
                              <div className="turn-delta">
                                {deltaItems.map((deltaItem) => (
                                  <span
                                    key={deltaItem.key}
                                    className={`delta-chip ${deltaItem.value > 0 ? 'plus' : 'minus'}`}
                                  >
                                    {deltaItem.label} {deltaItem.value > 0 ? '+' : ''}
                                    {deltaItem.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
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

                    <div className="career-type-box">
                      <span className="badge">커리어 유형</span>
                      <h3>{getCareerType(state)}</h3>
                    </div>

                    {lastEvent?.title === '시뮬레이션 조기 종료' && (
                      <div className="early-end-box">
                        <div className="badge" style={{ marginBottom: '10px' }}>
                          종료 사유
                        </div>
                        <p className="text-sub" style={{ color: '#ffe4e6', opacity: 1 }}>
                          {lastEvent.text}
                        </p>
                      </div>
                    )}

                    {riskBadges.length > 0 && (
                      <div className="result-risk-box">
                        <div className="badge" style={{ marginBottom: '10px' }}>
                          주요 위험 신호
                        </div>
                        <div className="result-risk-list">
                          {riskBadges.map((badge) => (
                            <span key={badge} className="result-risk-badge">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="glass-card"
                    style={{
                      padding: '24px',
                      borderRadius: '24px',
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div className="badge" style={{ marginBottom: '12px' }}>
                          핵심 결과
                        </div>
                        <div
                          style={{
                            fontSize: '0.95rem',
                            opacity: 0.8,
                            marginBottom: '10px',
                          }}
                        >
                          예상 근로 가능 연령
                        </div>
                        <div
                          style={{
                            fontSize: 'clamp(3rem, 8vw, 5.4rem)',
                            lineHeight: 1,
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            marginBottom: '10px',
                          }}
                        >
                          {workableAge}
                          <span style={{ fontSize: '0.38em', marginLeft: '8px' }}>세</span>
                        </div>
                        <div className="text-sub" style={{ fontSize: '0.98rem' }}>
                          직군 기대 연령 {jobExpectedAge}세 · 차이 {ageGap >= 0 ? '+' : ''}
                          {ageGap}세
                        </div>
                      </div>

                      <div
                        style={{
                          minWidth: '220px',
                          display: 'grid',
                          gap: '10px',
                        }}
                      >
                        <div
                          className="glass-card"
                          style={{ padding: '14px 16px', borderRadius: '16px' }}
                        >
                          <div className="badge" style={{ marginBottom: '8px' }}>
                            해석
                          </div>
                          <div style={{ fontWeight: 700 }}>{getAgeGapLabel(ageGap)}</div>
                        </div>

                        <div
                          className="glass-card"
                          style={{ padding: '14px 16px', borderRadius: '16px' }}
                        >
                          <div className="badge" style={{ marginBottom: '8px' }}>
                            종합 판정
                          </div>
                          <div style={{ fontWeight: 700 }}>{judgement.label}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '14px',
                    }}
                  >
                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        Final Score
                      </div>
                      <h3 style={{ fontSize: '2rem', marginBottom: '6px' }}>
                        {currentScore}점
                      </h3>
                      <p className="text-sub">{judgement.message}</p>
                    </div>

                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        현재 나이
                      </div>
                      <h3 style={{ fontSize: '2rem', marginBottom: '6px' }}>{state.age}세</h3>
                      <p className="text-sub">시뮬레이션 종료 시점 기준</p>
                    </div>

                    <div
                      className="glass-card"
                      style={{ padding: '18px', borderRadius: '18px' }}
                    >
                      <div className="badge" style={{ marginBottom: '10px' }}>
                        선택 직군 기준
                      </div>
                      <h3 style={{ fontSize: '2rem', marginBottom: '6px' }}>
                        {state.jobLabel}
                      </h3>
                      <p className="text-sub">기대 근로 가능 연령 {jobExpectedAge}세</p>
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
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '14px',
                        }}
                      >
                        <div
                          className="glass-card"
                          style={{ padding: '18px', borderRadius: '18px' }}
                        >
                          <div className="badge" style={{ marginBottom: '10px' }}>
                            낙관 시나리오
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                            {scenarioPreview.optimistic.workableAge}세
                          </div>
                          <div className="text-sub" style={{ marginTop: '6px' }}>
                            {scenarioPreview.optimistic.finalScore}점
                          </div>
                        </div>

                        <div
                          className="glass-card"
                          style={{ padding: '18px', borderRadius: '18px' }}
                        >
                          <div className="badge" style={{ marginBottom: '10px' }}>
                            기준 시나리오
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                            {scenarioPreview.baseline.workableAge}세
                          </div>
                          <div className="text-sub" style={{ marginTop: '6px' }}>
                            {scenarioPreview.baseline.finalScore}점
                          </div>
                        </div>

                        <div
                          className="glass-card"
                          style={{ padding: '18px', borderRadius: '18px' }}
                        >
                          <div className="badge" style={{ marginBottom: '10px' }}>
                            비관 시나리오
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                            {scenarioPreview.pessimistic.workableAge}세
                          </div>
                          <div className="text-sub" style={{ marginTop: '6px' }}>
                            {scenarioPreview.pessimistic.finalScore}점
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="result-action-row">
                    <button
                      className="result-action-btn primary-action"
                      onClick={() => setShowGuide(true)}
                    >
                      근로가능연령 늘리기 전략
                    </button>

                    <button className="result-action-btn" onClick={copyCurrentUrl}>
                      📤 친구에게 공유하기
                    </button>
                  </div>

                  <button className="btn-primary" onClick={restart}>
                    다시 플레이
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {turnFeedback && (
        <div className="turn-feedback-toast">
          <div className="turn-feedback-title">
            {turnFeedback.turn}년차 · {turnFeedback.action}
          </div>

          <div className="turn-feedback-sub">
            이벤트: {turnFeedback.event}
          </div>

          <div
            className="turn-delta"
            style={{ marginTop: '10px', justifyContent: 'center' }}
          >
            {getDeltaItems(turnFeedback.delta).map((deltaItem) => (
              <span
                key={deltaItem.key}
                className={`delta-chip ${deltaItem.value > 0 ? 'plus' : 'minus'}`}
              >
                {deltaItem.label} {deltaItem.value > 0 ? '+' : ''}
                {deltaItem.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <GuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        guideData={guideData}
        workableAge={workableAge}
        jobExpectedAge={jobExpectedAge}
        onShare={copyCurrentUrl}
        onRestart={restart}
      />
    </div>
  )
}

function getDeltaItems(delta) {
  if (!delta) return []

  const labelMap = {
    health: '건강',
    jobSecurity: '직업 안정성',
    adaptability: 'AI 적응력',
    resilience: '회복탄력성',
    money: '경제적 자원',
    stress: '스트레스',
  }

  return Object.entries(delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => ({
      key,
      label: labelMap[key] || key,
      value,
    }))
}

export default App