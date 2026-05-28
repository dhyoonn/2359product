'use client'

type SimpleGroup = { type: 'simple'; countries: string[]; cols: 1 | 2 | 3 }
type LabeledGroup = {
  type: 'labeled'
  subgroups: { label: string; countries: string[]; cols?: 1 | 2 }[]
}
type Group = SimpleGroup | LabeledGroup

const SCREENING_GROUPS: Group[] = [
  { type: 'simple', countries: ['국내', '북미', '일본'], cols: 1 },
  {
    type: 'labeled',
    subgroups: [{ label: '대만, 홍콩', countries: ['대만', '홍콩'], cols: 2 }],
  },
  {
    type: 'labeled',
    subgroups: [
      {
        label: '동남아',
        countries: ['필리핀', '말레이시아', '베트남', '태국', '싱가포르', '인도네시아'],
        cols: 2,
      },
    ],
  },
  { type: 'simple', countries: ['영국(SCPN)', 'EU(CPNP)'], cols: 2 },
]

export const SCREENING_STATUSES = [
  { value: 'pass', label: '진행·가능', color: 'bg-green-600 border-green-600' },
  { value: 'fail', label: '진행·불가', color: 'bg-red-500 border-red-500' },
  { value: 'pending', label: '미진행', color: 'bg-gray-500 border-gray-500' },
] as const

type StatusValue = typeof SCREENING_STATUSES[number]['value']
type StatusEntry = { status: StatusValue; reason?: string }
type StatusRecord = Record<string, StatusEntry>

function parseValue(value: string): StatusRecord {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [
        k,
        typeof v === 'string' ? { status: v as StatusValue } : (v as StatusEntry),
      ])
    )
  } catch {
    return {}
  }
}

function serialize(record: StatusRecord): string {
  return Object.keys(record).length === 0 ? '' : JSON.stringify(record)
}

export function ScreeningStatusTable({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const status = parseValue(value)

  const setStatus = (country: string, next: StatusValue) => {
    const updated = { ...status }
    if (updated[country]?.status === next) {
      delete updated[country]
    } else {
      updated[country] = { status: next, reason: updated[country]?.reason }
    }
    onChange(serialize(updated))
  }

  const setReason = (country: string, reason: string) => {
    const updated = { ...status }
    if (updated[country]) {
      updated[country] = { ...updated[country], reason }
      onChange(serialize(updated))
    }
  }

  const allCountries = SCREENING_GROUPS.flatMap((g) =>
    g.type === 'simple' ? g.countries : g.subgroups.flatMap((sg) => sg.countries)
  )

  const isAllPass = allCountries.every((c) => status[c]?.status === 'pass')

  const isDomesticOnly =
    status['국내']?.status === 'pass' &&
    allCountries.filter((c) => c !== '국내').every((c) => !status[c] || status[c]?.status === 'pending')

  const handleSetAllPass = () => {
    if (isAllPass) {
      onChange('')
    } else {
      const allPass = Object.fromEntries(allCountries.map((c) => [c, { status: 'pass' as StatusValue }]))
      onChange(JSON.stringify(allPass))
    }
  }

  const handleSetDomesticOnly = () => {
    if (isDomesticOnly) {
      onChange('')
    } else {
      const result = Object.fromEntries(
        allCountries.map((c) => [c, { status: (c === '국내' ? 'pass' : 'pending') as StatusValue }])
      )
      onChange(JSON.stringify(result))
    }
  }

  const renderStatusButtons = (country: string) => (
    <div className="flex flex-wrap gap-1.5">
      {SCREENING_STATUSES.map((option) => {
        const isActive = status[country]?.status === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(country, option.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isActive
                ? `${option.color} text-white`
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )

  const renderReasonInput = (country: string) => {
    if (status[country]?.status !== 'fail') return null
    return (
      <textarea
        value={status[country]?.reason ?? ''}
        onChange={(e) => setReason(country, e.target.value)}
        placeholder="불가 사유를 입력해주세요."
        rows={2}
        className="mt-1.5 w-full text-xs text-gray-700 resize-none border border-red-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300 bg-red-50 placeholder-gray-400"
      />
    )
  }

  // labeled 그룹용 셀 (국가명 + 버튼 + 사유 입력)
  const renderLabeledCell = (country: string, className?: string) => (
    <div key={country} className={className}>
      <div className="flex gap-2 items-center">
        <span className="shrink-0 w-20 text-xs text-gray-500">{country}</span>
        {renderStatusButtons(country)}
      </div>
      {renderReasonInput(country)}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">수출 스크리닝 상태</h3>
          <p className="text-[11px] text-gray-400 mt-1">국가 별로 성분 스크리닝 진행 여부와 결과를 선택하세요.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSetDomesticOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isDomesticOnly
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600'
            }`}
          >
            국내만 가능
          </button>
          <button
            type="button"
            onClick={handleSetAllPass}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isAllPass
                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600'
            }`}
          >
            전부가능
          </button>
        </div>
      </div>
      <div>
        {SCREENING_GROUPS.map((group, gIdx) => {
          const isLastGroup = gIdx === SCREENING_GROUPS.length - 1
          const groupBorder = !isLastGroup ? 'border-b-2 border-gray-100' : ''

          if (group.type === 'simple') {
            const countryLabelClass =
              'shrink-0 w-20 px-3 bg-gray-50 border-r border-gray-100 flex items-center justify-center text-center text-xs text-gray-500'

            if (group.cols === 1) {
              return (
                <div key={gIdx} className={groupBorder}>
                  {group.countries.map((country, idx) => {
                    const isLast = idx === group.countries.length - 1
                    return (
                      <div key={country} className="relative pl-20 pr-20">
                        <span className={`absolute left-0 top-0 bottom-0 ${countryLabelClass}`}>
                          {country}
                        </span>
                        <div
                          className={`py-3 flex flex-col items-center gap-1.5 ${
                            !isLast ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          {renderStatusButtons(country)}
                          {renderReasonInput(country)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
            const gridClass = group.cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
            return (
              <div key={gIdx} className={`grid grid-cols-1 ${gridClass} ${groupBorder}`}>
                {group.countries.map((country, idx) => {
                  const total = group.countries.length
                  const lastRowStart = total - (total % group.cols === 0 ? group.cols : total % group.cols)
                  const isLastRow = idx >= lastRowStart
                  const isRightmostCol = (idx + 1) % group.cols === 0
                  const hasNext = idx + 1 < total
                  return (
                    <div
                      key={country}
                      className={`flex items-stretch ${
                        !isLastRow ? 'border-b border-gray-100' : ''
                      } ${!isRightmostCol && hasNext ? 'md:border-r md:border-gray-100' : ''}`}
                    >
                      <span className={countryLabelClass}>{country}</span>
                      <div className="flex-1 px-3 py-3 flex flex-col gap-1.5">
                        {renderStatusButtons(country)}
                        {renderReasonInput(country)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          const subGridClass = group.subgroups.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2'
          return (
            <div key={gIdx} className={`grid grid-cols-1 ${subGridClass} ${groupBorder}`}>
              {group.subgroups.map((sg, sgIdx) => {
                const isLastSubgroup = sgIdx === group.subgroups.length - 1
                return (
                  <div
                    key={sg.label}
                    className={`flex items-stretch ${!isLastSubgroup ? 'md:border-r border-gray-100' : ''}`}
                  >
                    <div className="shrink-0 w-20 px-2 py-3 bg-gray-50 border-r border-gray-100 flex items-center justify-center text-center text-[11px] text-gray-600">
                      {sg.label}
                    </div>
                    {sg.cols === 2 && sg.countries.length > 2 ? (
                      (() => {
                        const half = Math.ceil(sg.countries.length / 2)
                        const leftCol = sg.countries.slice(0, half)
                        const rightCol = sg.countries.slice(half)
                        return (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                            <div className="divide-y divide-gray-100 md:border-r md:border-gray-100">
                              {leftCol.map((c) => renderLabeledCell(c, 'px-3 py-2'))}
                            </div>
                            <div className="divide-y divide-gray-100">
                              {rightCol.map((c) => renderLabeledCell(c, 'px-3 py-2'))}
                            </div>
                          </div>
                        )
                      })()
                    ) : sg.cols === 2 ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                        {sg.countries.map((country, idx) => {
                          const isLeftCol = idx % 2 === 0
                          const hasNext = idx + 1 < sg.countries.length
                          const total = sg.countries.length
                          const lastRowStart = total - (total % 2 === 0 ? 2 : 1)
                          const isLastRow = idx >= lastRowStart
                          return renderLabeledCell(
                            country,
                            `px-3 py-2 ${!isLastRow ? 'border-b border-gray-100' : ''} ${
                              isLeftCol && hasNext ? 'md:border-r md:border-gray-100' : ''
                            }`
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 divide-y divide-gray-100">
                        {sg.countries.map((c) => renderLabeledCell(c, 'px-3 py-2'))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
