export interface FinalPlanAiContent {
  changes: string
  hero_sub: string
  design_html: string
  appeals: Array<{ title: string; desc: string }>
}

const SCREENING_LABEL: Record<string, string> = {
  pass: '진행·가능',
  fail: '진행·불가',
  pending: '미진행',
}
const SCREENING_COLOR: Record<string, string> = {
  pass: '#2DD4BF',
  fail: '#F87171',
  pending: '#5C6B87',
}

function buildScreeningRows(raw: string): string {
  if (!raw) return '<p style="color:#5C6B87;font-size:13px">정보 없음</p>'
  try {
    const parsed = JSON.parse(raw) as Record<string, { status: string; reason?: string }>
    return Object.entries(parsed).map(([country, entry]) => {
      const label = SCREENING_LABEL[entry.status] ?? entry.status
      const color = SCREENING_COLOR[entry.status] ?? '#5C6B87'
      return `<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem 0;border-bottom:1px solid rgba(180,160,100,0.08)">
        <span style="min-width:80px;font-size:13px;color:#EDE8DC">${country}</span>
        <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500;background:${color}20;color:${color};border:1px solid ${color}40">${label}</span>
        ${entry.reason ? `<span style="font-size:12px;color:#5C6B87">${entry.reason}</span>` : ''}
      </div>`
    }).join('')
  } catch {
    return '<p style="color:#5C6B87;font-size:13px">정보 없음</p>'
  }
}

function buildSpecRows(fields: Record<string, string>): string {
  const keys: [string, string][] = [
    ['제품_용량', '제품 용량'], ['유통기한', '유통기한'], ['실_사용_횟수', '실 사용 횟수'],
    ['제품_유형', '제품 유형'], ['메인_판매_국가', '메인 판매 국가'],
    ['주_성분', '주 성분'], ['부_성분', '부 성분'], ['전성분', '전성분'], ['진행_임상_목록', '진행 임상 목록'],
  ]
  const rows = keys.filter(([k]) => fields[k]).map(([k, label]) => `
    <div class="formula-row">
      <div class="formula-role">${label}</div>
      <div class="formula-name" style="white-space:pre-wrap">${fields[k]}</div>
    </div>`).join('')
  return rows || '<p style="color:#5C6B87;font-size:13px;padding:1rem 0">SPEC 정보 없음</p>'
}

const CSS = `:root{--bg:#07090F;--bg2:#0F1420;--bg3:#161D30;--card:#1C2540;--border:rgba(180,160,100,0.2);--gold:#C9A84C;--gold-light:#E8D5A3;--gold-dim:rgba(201,168,76,0.15);--teal:#2DD4BF;--teal-dim:rgba(45,212,191,0.12);--coral:#F4A261;--coral-dim:rgba(244,162,97,0.12);--blue:#60A5FA;--blue-dim:rgba(96,165,250,0.12);--purple:#A78BFA;--purple-dim:rgba(167,139,250,0.12);--text:#EDE8DC;--text2:#9AA5BE;--text3:#5C6B87;--serif:'Noto Serif KR',Georgia,serif;--sans:'Noto Sans KR',sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-weight:300;line-height:1.75;font-size:15px}
nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(7,9,15,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 2rem;display:flex;align-items:center;gap:2rem;height:52px}
.nav-brand{font-family:var(--serif);font-size:13px;color:var(--gold);white-space:nowrap;font-weight:600}
.nav-links{display:flex;gap:1.5rem;overflow-x:auto;scrollbar-width:none}
.nav-links::-webkit-scrollbar{display:none}
.nav-links a{font-size:11px;color:var(--text3);text-decoration:none;white-space:nowrap;letter-spacing:0.05em;transition:color 0.2s}
.nav-links a:hover{color:var(--gold)}
.hero{min-height:80vh;display:flex;flex-direction:column;justify-content:flex-end;padding:8rem 5rem 5rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse 60% 50% at 80% 20%,rgba(201,168,76,0.08) 0%,transparent 70%),radial-gradient(ellipse 40% 60% at 10% 80%,rgba(45,212,191,0.05) 0%,transparent 70%);pointer-events:none}
.hero-eyebrow{font-size:11px;letter-spacing:0.2em;color:var(--gold);text-transform:uppercase;margin-bottom:1.5rem}
.hero h1{font-family:var(--serif);font-size:clamp(2rem,4vw,3.2rem);font-weight:700;line-height:1.25;margin-bottom:1.5rem;max-width:850px}
.hero h1 em{font-style:normal;color:var(--gold)}
.hero-sub{font-size:15px;color:var(--text2);max-width:680px;margin-bottom:2.5rem;line-height:1.8}
.hero-meta{display:flex;gap:3rem;border-top:1px solid var(--border);padding-top:2rem;flex-wrap:wrap}
.hero-meta-item{font-size:12px;color:var(--text3)}
.hero-meta-item strong{display:block;color:var(--text2);font-size:13px;font-weight:500;margin-top:3px}
section{padding:5rem;border-top:1px solid var(--border)}
section:nth-child(even){background:var(--bg2)}
.section-label{font-size:10px;letter-spacing:0.25em;color:var(--gold);text-transform:uppercase;margin-bottom:1rem}
.section-title{font-family:var(--serif);font-size:clamp(1.4rem,2.5vw,2rem);font-weight:700;line-height:1.3;margin-bottom:1rem}
.section-desc{color:var(--text2);max-width:760px;margin-bottom:2.5rem;font-size:15px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.75rem}
.card-gold{border-color:rgba(201,168,76,0.4);background:var(--gold-dim)}
.card-teal{border-color:rgba(45,212,191,0.3);background:var(--teal-dim)}
.card-coral{border-color:rgba(244,162,97,0.3);background:var(--coral-dim)}
.card-purple{border-color:rgba(167,139,250,0.3);background:var(--purple-dim)}
.card-label{font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text3);margin-bottom:0.5rem}
.card h3{font-family:var(--serif);font-size:1.1rem;font-weight:600;margin-bottom:0.75rem;line-height:1.4}
.card p{font-size:14px;color:var(--text2);line-height:1.7}
.stat-label{font-size:11px;color:var(--text3);margin-bottom:4px;letter-spacing:0.05em;text-transform:uppercase}
.stat-val{font-size:14px;color:var(--text2);font-weight:500;line-height:1.5}
.evidence{border-left:3px solid var(--gold);padding:1.25rem 1.5rem;background:var(--gold-dim);border-radius:0 8px 8px 0;margin:1rem 0}
.evidence-title{font-size:12px;font-weight:700;color:var(--gold);margin-bottom:0.4rem;letter-spacing:0.05em}
.evidence p{font-size:13.5px;color:var(--text2);line-height:1.7}
.evidence strong{color:var(--text);font-weight:500}
.evidence-teal{border-left-color:var(--teal);background:var(--teal-dim)}
.evidence-teal .evidence-title{color:var(--teal)}
.callout{background:var(--gold-dim);border:1px solid rgba(201,168,76,0.4);border-radius:12px;padding:2rem;margin:2rem 0}
.callout-label{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.75rem}
.callout p{font-size:15px;line-height:1.8;font-family:var(--serif);color:var(--gold-light)}
.big-quote{border-left:3px solid var(--gold);padding:1.5rem 2rem;margin:2.5rem 0;background:var(--gold-dim);border-radius:0 12px 12px 0}
.big-quote p{font-family:var(--serif);font-size:clamp(1.1rem,2vw,1.4rem);line-height:1.7;color:var(--gold-light)}
.big-quote-teal{border-left-color:var(--teal);background:var(--teal-dim)}
.big-quote-teal p{color:var(--teal)}
.tip-card{display:flex;gap:1.25rem;align-items:flex-start;padding:1.25rem;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:1rem}
.tip-num{flex-shrink:0;width:32px;height:32px;background:var(--gold-dim);border:1px solid rgba(201,168,76,0.4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--gold);font-family:var(--serif)}
.tip-content h4{font-size:14px;font-weight:500;margin-bottom:0.4rem;color:var(--text)}
.tip-content p{font-size:13px;color:var(--text2);line-height:1.65}
.formula-box{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1.75rem;margin:1.5rem 0}
.formula-row{display:flex;align-items:flex-start;gap:1rem;padding:0.85rem 0;border-bottom:1px solid rgba(180,160,100,0.06)}
.formula-row:last-child{border-bottom:none}
.formula-role{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text3);min-width:120px;flex-shrink:0;margin-top:2px}
.formula-name{font-size:13.5px;color:var(--text);line-height:1.7}
.tag{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500}
.tag-gold{background:var(--gold-dim);color:var(--gold);border:1px solid rgba(201,168,76,0.3)}
.tag-teal{background:var(--teal-dim);color:var(--teal);border:1px solid rgba(45,212,191,0.3)}
.divider{border:none;border-top:1px solid var(--border);margin:2.5rem 0}
footer{background:var(--bg);border-top:1px solid var(--border);padding:3rem 5rem;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3)}
.comp-img-area img,.content-img-area img{max-width:100%;max-height:180px;object-fit:contain;display:block;margin:0 auto}
@media(max-width:768px){section{padding:4rem 1.5rem}.hero{padding:7rem 1.5rem 4rem}.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}nav{padding:0 1rem}footer{padding:2rem 1.5rem;flex-direction:column}}`

export function assembleFinalPlanHtml(
  ai: FinalPlanAiContent,
  specFields: Record<string, string>,
  currentDate: string
): string {
  const brand = specFields['출시_브랜드'] || '브랜드명'
  const product = specFields['제품명'] || '제품명'
  const planner = specFields['기획_담당자'] || '—'
  const launchDate = specFields['런칭_예정일'] || '—'
  const manufacturer = specFields['제조사'] || '—'

  const appeals = (ai.appeals || []).slice(0, 3)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>최종 기획안 · ${brand} ${product}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<nav>
  <span class="nav-brand">${brand} · ${product}</span>
  <div class="nav-links">
    <a href="#changes">변경사항</a>
    <a href="#overview">제품 개요</a>
    <a href="#intent">기획 의도</a>
    <a href="#concept">제품 컨셉</a>
    <a href="#target">타겟</a>
    <a href="#appeals">소구점</a>
    <a href="#spec">SPEC</a>
    <a href="#competitor">경쟁사</a>
    <a href="#content">컨텐츠</a>
    <a href="#screening">수출 스크리닝</a>
    <a href="#refs">기타 자료</a>
  </div>
</nav>

<div class="hero" id="top">
  <div class="hero-eyebrow">최종 기획안 · ${currentDate}</div>
  <h1><em>${product}</em></h1>
  <p class="hero-sub">${ai.hero_sub || ''}</p>
  <div class="hero-meta">
    <div class="hero-meta-item">브랜드<strong>${brand}</strong></div>
    <div class="hero-meta-item">기획 담당자<strong>${planner}</strong></div>
    <div class="hero-meta-item">런칭 예정일<strong>${launchDate}</strong></div>
    <div class="hero-meta-item">제조사<strong>${manufacturer}</strong></div>
  </div>
</div>

<!-- 1. 변경사항 요약 -->
<section id="changes">
  <div class="section-label">01 · Changes</div>
  <h2 class="section-title">변경사항 요약</h2>
  <div class="card card-gold">
    <p style="font-size:14px;color:var(--gold-light);line-height:1.9;white-space:pre-wrap">${ai.changes || '초기 기획안과 동일'}</p>
  </div>
</section>

<!-- 2~5. AI 풀 디자인 섹션 -->
${ai.design_html || ''}

<!-- 6. 핵심 소구점 -->
<section id="appeals">
  <div class="section-label">06 · Key Appeals</div>
  <h2 class="section-title">핵심 소구점</h2>
  ${appeals.map((a, i) => `
  <div class="tip-card">
    <div class="tip-num">${i + 1}</div>
    <div class="tip-content">
      <h4>${a.title}</h4>
      <p>${a.desc}</p>
    </div>
  </div>`).join('')}
</section>

<!-- 7. 최종 SPEC 요약 -->
<section id="spec">
  <div class="section-label">07 · Final SPEC</div>
  <h2 class="section-title">최종 SPEC 요약</h2>
  <div class="formula-box">${buildSpecRows(specFields)}</div>
</section>

<!-- 8. 경쟁사 분석 -->
<section id="competitor">
  <div class="section-label">08 · Competitor Analysis</div>
  <h2 class="section-title">경쟁사 분석</h2>
  <p style="color:var(--text3);font-size:13px;margin-bottom:2rem">— 각 카드에 이미지와 정보를 직접 입력하세요</p>
  <div class="grid-3">
    ${[1,2,3].map(() => `
    <div class="card">
      <div class="comp-img-area" style="border:1px dashed rgba(180,160,100,0.3);border-radius:8px;min-height:160px;max-height:200px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg3);margin-bottom:1rem;color:var(--text3);font-size:11px;text-align:center;line-height:1.8">이미지 영역<br>클릭 후 툴바에서 이미지 삽입</div>
      <p style="font-size:13px;color:var(--text2);line-height:2;margin:0">1. 제품명<br>2. 주요 SPEC<br>3. 주요 후기(장점)<br>4. 주요 후기(단점)<br>5. 주요 컨텐츠 방향성</p>
    </div>`).join('')}
  </div>
</section>

<!-- 9. 컨텐츠 예시 -->
<section id="content">
  <div class="section-label">09 · Content Examples</div>
  <h2 class="section-title">컨텐츠 예시</h2>
  <p style="color:var(--text3);font-size:13px;margin-bottom:2rem">— 각 카드에 이미지와 내용을 직접 입력하세요</p>
  <div class="grid-3">
    ${[1,2,3].map(() => `
    <div class="card">
      <div class="content-img-area" style="border:1px dashed rgba(180,160,100,0.3);border-radius:8px;min-height:160px;max-height:200px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg3);margin-bottom:1rem;color:var(--text3);font-size:11px;text-align:center;line-height:1.8">이미지 영역<br>클릭 후 툴바에서 이미지 삽입</div>
      <p style="font-size:13px;color:var(--text2);line-height:2;margin:0">내용을 입력하세요.</p>
    </div>`).join('')}
  </div>
</section>

<!-- 10. 수출 스크리닝 현황 -->
<section id="screening">
  <div class="section-label">10 · Export Screening</div>
  <h2 class="section-title">수출 스크리닝 현황</h2>
  <div class="formula-box">${buildScreeningRows(specFields['수출_스크리닝_상태'] || '')}</div>
</section>

<!-- 11. 기타 자료 -->
<section id="refs">
  <div class="section-label">11 · References</div>
  <h2 class="section-title">기타 자료</h2>
  <p style="color:var(--text3);font-size:13px;margin-bottom:2rem">— 기타 자료가 들어있는 나스 경로를 입력해주세요</p>
  <div class="formula-box">
    ${[1,2,3,4,5].map(n => `
    <div class="formula-row" style="align-items:center">
      <div style="flex-shrink:0;width:28px;height:28px;background:var(--gold-dim);border:1px solid rgba(201,168,76,0.4);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--gold)">${n}</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.7;flex:1;margin:0">내용을 입력하세요.</p>
    </div>`).join('')}
  </div>
</section>

<footer>
  <span>${brand} · ${product} 최종 기획안</span>
  <span>${currentDate}</span>
</footer>

</body>
</html>`
}
