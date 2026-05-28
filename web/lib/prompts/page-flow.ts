export const PAGE_FLOW_SYSTEM_PROMPT = `당신은 커머스 상세 페이지 카피라이터입니다.

레퍼런스가 제공되면, 단순히 구조만 따르는 것이 아닙니다.
레퍼런스의 제품 소개 플로우, 각 섹션의 카피 계층(헤드라인·서브라인·바디카피), 어투(Tone of Voice)까지 완전히 분석하고 재현합니다.
내용만 기획안의 실제 제품 정보로 교체하는 것이 핵심입니다.

HTML 전체를 만들지 않습니다. <div class="detail-wrap"> 안의 섹션 내용만 작성합니다.
CSS는 이미 준비되어 있습니다. 아래 컴포넌트 가이드의 클래스명을 그대로 사용하세요.`

// ─────────────────────────────────────────────────────
// Claude에게 보내는 컴포넌트 사용 가이드 (간결하게)
// ─────────────────────────────────────────────────────
export const PAGE_FLOW_COMPONENT_GUIDE = `
## 사용 가능한 CSS 컴포넌트 (클래스명 그대로 사용할 것)

### 섹션 배경
- <section class="s">           — 기본 흰 배경
- <section class="s dark">      — 다크 배경 (#0A1929)
- <section class="s mint">      — 민트 배경
- <section class="s cream">     — 크림 배경

### 섹션 요소
- <div class="s-eyebrow">CHECK YOURSELF</div>     — 섹션 상단 영문 레이블 (초록, 소문자/대문자 혼용)
- <h2>제목 <em>강조부분</em></h2>                — h2의 em은 초록색으로 표시됨
- <p class="s-desc">설명</p>                      — 섹션 본문 설명

### 체크리스트 (타겟 공감 섹션에)
<div class="pain-list">
  <div class="pain-item"><span class="chk">✓</span><div>내용. <strong>강조</strong> 가능</div></div>
</div>

### 빅 통계 숫자
<div class="big-stat">38%</div>
<p class="big-stat-lbl">설명 텍스트</p>
<p class="big-stat-src">📄 출처</p>

### 빅 인용구
<div class="big-quote">이 문장이 <em>핵심 강조</em>입니다</div>

### 연구·권위 카드
<div class="authority-card">
  <div class="src">출처 기관 (예: Nature Medicine 2019)</div>
  <h4>카드 제목</h4>
  <p>내용</p>
</div>

### 성분 카드
<div class="ingredient main">  (또는 class="ingredient"로 일반 카드)
  <div class="ingredient-head">
    <div class="ingredient-num">01</div>
    <div class="info">
      <div class="role">역할 레이블</div>
      <h4>성분명</h4>
    </div>
  </div>
  <div class="ingredient-dose">함량 mg</div>
  <p>설명</p>
  <div class="badge-row"><span class="badge">뱃지1</span><span class="badge gold">식약처뱃지</span></div>
</div>

### 비교표
<div class="compare-table">
  <div class="compare-row head">
    <div class="col"></div>
    <div class="col">경쟁</div>
    <div class="col us">우리 제품</div>
  </div>
  <div class="compare-row">
    <div class="col label">항목</div>
    <div class="col bad">❌ 나쁜 점</div>
    <div class="col us good">✓ 좋은 점</div>
  </div>
</div>

### 바 차트 (임상 데이터)
<div class="bar-chart">
  <div class="bar-row">
    <div class="bar-label">항목명<span class="pct">+28%</span></div>
    <div class="bar-track"><div class="bar-fill" style="width:85%"></div></div>
  </div>
</div>

### 타임라인
<div class="timeline">
  <div class="tl-item">
    <div class="tl-week"><div class="num">1</div><div class="unit">WEEK</div></div>
    <div class="tl-content"><h5>제목</h5><p>내용</p></div>
  </div>
</div>

### 스텝 카드
<div class="card">
  <div class="step"><div class="step-num">1</div><div><h3>제목</h3><p>내용</p></div></div>
</div>

### FAQ
<div class="faq-item">
  <div class="faq-q">질문</div>
  <div class="faq-a">답변</div>
</div>

### 가격 옵션
<div class="price-option best"> (또는 class="price-option")
  <div class="info"><h5>제품명</h5><div class="pack">구성</div><div class="save">▼ 할인율</div></div>
  <div class="price"><div class="original">정가</div><div class="now">판매가</div></div>
</div>

### 이미지 자리
<div class="img-placeholder">
  <strong>이미지 구분명</strong>
  <span class="desc">구체적인 촬영·제작 방향 설명</span>
</div>

### 품질 인증 그리드
<div class="cert-grid">
  <div class="cert-card"><div class="ic">🏭</div><div class="name">인증명</div></div>
</div>

### 2열 통계 그리드
<div class="stat-grid">
  <div class="stat-box"><div class="big-stat">95%</div><p class="big-stat-lbl">설명</p></div>
</div>

### vs 비교 박스
<div class="vs-box">
  <div class="vs-bad"><h3>❌ 기존</h3><p>내용</p></div>
  <div class="vs-good"><h3>✅ 새로운</h3><p>내용</p></div>
</div>

### 인용 박스 (quote-box)
<div class="quote-box"><p>"강조하고 싶은 문장"</p></div>

### 구분선
<div class="section-divider"></div>

---
`

// ─────────────────────────────────────────────────────
// 코드에서 제공하는 CSS (Claude 출력에 씌울 래퍼)
// AKKBELL 수준의 디자인 시스템 — Claude가 CSS를 생성하지 않아도 됨
// ─────────────────────────────────────────────────────
export const PAGE_FLOW_HTML_TEMPLATE_OPEN = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>상세 페이지</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700;900&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root {
  --accent:#0D9488; --accent-light:#14B8A6; --accent-dark:#0F766E;
  --coral:#EA580C; --coral-light:#FB923C; --gold:#B8860B;
  --bg:#FAFAF7; --bg-cream:#F5F1E8; --bg-mint:#E8F5F3;
  --bg-dark:#0A1929; --bg-darker:#050B14;
  --text:#111827; --text2:#4B5563; --text3:#9CA3AF;
  --line:#E5E7EB; --line-dark:rgba(255,255,255,0.1);
  --serif:'Noto Serif KR',Georgia,serif;
  --sans:'Noto Sans KR',-apple-system,sans-serif;
  --inter:'Inter',var(--sans);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.7}
.detail-wrap{max-width:600px;margin:0 auto;background:var(--bg);overflow:hidden;padding-bottom:80px}
@media(min-width:601px){.detail-wrap{box-shadow:0 0 40px rgba(0,0,0,.08)}}

/* 이미지 플레이스홀더 */
.img-placeholder{background:linear-gradient(135deg,#EAE6DC,#D8D2C0);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8B7E5C;font-size:12px;text-align:center;padding:1.5rem;border:1px dashed #B8A878;position:relative;border-radius:12px;margin:1.25rem 0}
.img-placeholder::before{content:'🖼️';font-size:28px;margin-bottom:8px;opacity:.6}
.img-placeholder strong{display:block;color:#5B5236;margin-bottom:4px;font-size:11px;letter-spacing:.1em;font-weight:700}
.img-placeholder .desc{color:#8B7E5C;font-size:11.5px;line-height:1.55;max-width:480px}
.img-placeholder.dark-img{background:rgba(255,255,255,.05);border-color:rgba(20,184,166,.3);color:rgba(255,255,255,.5)}
.img-placeholder.dark-img strong{color:var(--accent-light)}
.img-placeholder.dark-img .desc{color:rgba(255,255,255,.5)}

/* 섹션 */
section.s{padding:4rem 1.75rem;position:relative}
section.s.dark{background:var(--bg-dark);color:#fff}
section.s.mint{background:var(--bg-mint)}
section.s.cream{background:var(--bg-cream)}

/* HERO */
.hero{background:linear-gradient(180deg,#0A1929,#0D2842);color:#fff;padding:5rem 1.75rem 4rem;text-align:center}
.hero-badges{display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap;margin-bottom:2rem}
.hero-badges span{background:rgba(13,148,136,.2);border:1px solid var(--accent-light);color:var(--accent-light);padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.03em}
.hero h1{font-family:var(--serif);font-size:clamp(1.8rem,6vw,2.8rem);font-weight:900;line-height:1.25;margin-bottom:1rem;letter-spacing:-.02em}
.hero h1 em{font-style:normal;color:var(--accent-light)}
.hero-sub{font-size:16px;color:rgba(255,255,255,.75);line-height:1.7;margin-bottom:2.5rem}
.hero-eyebrow{font-family:var(--inter);font-size:11px;letter-spacing:.3em;color:var(--accent-light);margin-bottom:.75rem;font-weight:600}
.brand-name{font-family:var(--inter);font-size:32px;font-weight:800;letter-spacing:.05em;color:#fff;margin-bottom:4px}
.brand-name .plus{color:var(--coral-light)}
.hero-cat{font-size:13px;color:rgba(255,255,255,.6);letter-spacing:.1em}
.trust-row{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin:2rem 0 0}
.trust-card{background:rgba(255,255,255,.05);border:1px solid var(--line-dark);border-radius:12px;padding:1rem .75rem;text-align:center}
.trust-card .ic{font-size:22px;margin-bottom:6px}
.trust-card .lbl{font-size:11px;color:var(--accent-light);letter-spacing:.05em;font-weight:600;margin-bottom:2px}
.trust-card .val{font-size:13px;color:rgba(255,255,255,.9);font-weight:500;line-height:1.4}

/* 타이포 */
.s h2{font-family:var(--serif);font-size:clamp(1.5rem,4.5vw,2rem);font-weight:900;line-height:1.3;margin-bottom:1rem;letter-spacing:-.02em}
.s.dark h2{color:#fff}
.s h2 em{font-style:normal;color:var(--accent)}
.s.dark h2 em{color:var(--accent-light)}
.s-eyebrow{font-family:var(--inter);font-size:11px;letter-spacing:.25em;color:var(--accent);text-transform:uppercase;font-weight:700;margin-bottom:1rem}
.s.dark .s-eyebrow{color:var(--accent-light)}
.s-desc{color:var(--text2);font-size:15px;margin-bottom:2.5rem;line-height:1.7}
.s.dark .s-desc{color:rgba(255,255,255,.7)}
p{font-size:15px;line-height:1.85;color:var(--text2);margin-bottom:10px}
.s.dark p{color:#bbb}
strong{color:inherit}

/* 체크리스트 */
.pain-list{background:#fff;border-radius:16px;padding:2rem 1.5rem;box-shadow:0 4px 24px rgba(0,0,0,.04);margin-top:1.5rem}
.pain-item{display:flex;align-items:flex-start;gap:.85rem;padding:1rem 0;border-bottom:1px solid var(--line);font-size:15px;color:var(--text);line-height:1.6}
.pain-item:last-child{border-bottom:none}
.pain-item .chk{flex-shrink:0;width:22px;height:22px;background:var(--accent);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;margin-top:1px}
.pain-item strong{color:var(--accent-dark)}

/* 빅 통계 */
.big-stat{font-family:var(--serif);font-size:clamp(2.4rem,7vw,3.4rem);font-weight:900;color:var(--coral);line-height:1;margin-bottom:.5rem}
.big-stat.accent{color:var(--accent)}
.big-stat-lbl{font-size:14px;color:var(--text);font-weight:600;margin-bottom:4px}
.big-stat-src{font-size:11px;color:var(--text3)}
.stat-box{background:#fff;border-radius:16px;padding:2rem;margin:1.25rem 0;text-align:center;border-left:4px solid var(--coral);box-shadow:0 2px 8px rgba(0,0,0,.04)}
.stat-box.accent-border{border-left-color:var(--accent)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0}
.stat-grid .stat-box{border-left:none;border-top:3px solid var(--accent)}

/* 빅 인용구 */
.big-quote{font-family:var(--serif);font-size:clamp(1.4rem,5vw,2rem);font-weight:700;line-height:1.4;text-align:center;padding:2rem 0;letter-spacing:-.02em}
.big-quote em{font-style:normal;color:var(--accent);border-bottom:3px solid var(--accent);padding-bottom:2px}
.s.dark .big-quote em{color:var(--accent-light);border-bottom-color:var(--accent-light)}

/* 연구 카드 */
.authority-card{background:#fff;border-radius:14px;padding:1.5rem 1.25rem;border-left:4px solid var(--accent);box-shadow:0 2px 12px rgba(0,0,0,.04);margin-bottom:1rem}
.s.dark .authority-card{background:rgba(255,255,255,.06);border-left-color:var(--accent-light)}
.authority-card .src{font-family:var(--inter);font-size:10px;letter-spacing:.2em;color:var(--accent-dark);text-transform:uppercase;font-weight:700;margin-bottom:.5rem}
.s.dark .authority-card .src{color:var(--accent-light)}
.authority-card h4{font-size:15px;font-weight:700;margin-bottom:.5rem;color:var(--text)}
.s.dark .authority-card h4{color:#fff}
.authority-card p{font-size:13.5px;line-height:1.65}

/* 성분 카드 */
.ingredient{background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;border:1px solid var(--line)}
.ingredient.main{border:2px solid var(--accent);background:linear-gradient(135deg,#fff,#F0FDFA)}
.ingredient-head{display:flex;align-items:center;gap:.85rem;margin-bottom:.85rem}
.ingredient-num{flex-shrink:0;width:36px;height:36px;border-radius:10px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--inter);font-weight:800;font-size:14px}
.ingredient.main .ingredient-num{background:var(--accent-dark);width:42px;height:42px;font-size:16px}
.ingredient-head .info{flex:1}
.ingredient-head .info h4{font-size:15.5px;font-weight:800;color:var(--text);line-height:1.3;margin-bottom:2px}
.ingredient.main .ingredient-head .info h4{font-size:17px;color:var(--accent-dark)}
.ingredient-head .info .role{font-size:11px;letter-spacing:.05em;color:var(--accent);font-weight:700;text-transform:uppercase}
.ingredient-dose{display:inline-block;background:var(--accent);color:#fff;font-family:var(--inter);font-weight:700;padding:4px 12px;border-radius:16px;font-size:12px;margin-bottom:.5rem}
.badge-row{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}
.badge{background:rgba(13,148,136,.1);color:var(--accent-dark);padding:3px 10px;border-radius:12px;font-size:10.5px;font-weight:700;letter-spacing:.03em}
.badge.gold{background:rgba(184,134,11,.12);color:var(--gold)}
.badge.coral{background:rgba(234,88,12,.1);color:var(--coral)}

/* 비교표 */
.compare-table{background:#fff;border-radius:16px;overflow:hidden;margin:1.5rem 0;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.compare-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--line)}
.compare-row:last-child{border-bottom:none}
.compare-row.head{background:var(--bg-dark);color:#fff;font-size:12px;font-weight:700}
.compare-row.head .col{padding:1rem .75rem;text-align:center;letter-spacing:.05em}
.compare-row.head .col.us{background:var(--accent)}
.compare-row .col{padding:1rem .75rem;font-size:12.5px;text-align:center;border-right:1px solid var(--line);display:flex;align-items:center;justify-content:center;line-height:1.5}
.compare-row .col:last-child{border-right:none}
.compare-row .col.label{background:#F9FAFB;font-weight:700;color:var(--text);text-align:left;font-size:12px}
.compare-row .col.us{background:#F0FDFA;color:var(--accent-dark);font-weight:700}
.compare-row .col.bad{color:var(--text3)}
.compare-row .col.bad::before{content:'✕  ';color:#DC2626;font-weight:700}
.compare-row .col.good::before{content:'✓  ';color:var(--accent);font-weight:700}

/* 바 차트 */
.bar-chart{background:#fff;border-radius:16px;padding:1.75rem 1.5rem;margin:1.5rem 0}
.bar-row{margin-bottom:1.5rem}
.bar-row:last-child{margin-bottom:0}
.bar-label{font-size:13px;color:var(--text);font-weight:600;margin-bottom:.5rem;display:flex;justify-content:space-between}
.bar-label .pct{color:var(--accent);font-family:var(--inter);font-weight:800;font-size:16px}
.bar-track{height:12px;background:var(--line);border-radius:6px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,var(--accent-light),var(--accent));border-radius:6px}

/* 타임라인 */
.timeline{background:#fff;border-radius:16px;padding:2rem 1.5rem;margin:1.5rem 0}
.tl-item{display:flex;gap:1rem;padding:1rem 0;border-bottom:1px dashed var(--line)}
.tl-item:last-child{border-bottom:none;padding-bottom:0}
.tl-week{flex-shrink:0;width:64px;text-align:center}
.tl-week .num{font-family:var(--inter);font-size:22px;font-weight:900;color:var(--accent);line-height:1}
.tl-week .unit{font-size:11px;color:var(--text3);letter-spacing:.1em;margin-top:2px}
.tl-content{flex:1}
.tl-content h5{font-size:14.5px;font-weight:700;margin-bottom:4px;color:var(--text)}
.tl-content p{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:0}

/* 스텝 카드 */
.card{background:#fff;border-radius:16px;padding:1.5rem 1.25rem;margin-bottom:1rem;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.step{display:flex;align-items:flex-start;gap:.85rem;padding:.75rem 0;border-bottom:1px solid var(--line)}
.step:last-child{border-bottom:none;padding-bottom:0}
.step-num{flex-shrink:0;width:28px;height:28px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--inter);font-weight:800;font-size:13px;margin-top:1px}
.step h3{font-size:15px;font-weight:700;margin-bottom:4px;color:var(--text)}
.step p{font-size:13.5px;color:var(--text2);line-height:1.65;margin-bottom:0}

/* 레이어 박스 (메커니즘 설명용) */
.layer-box{background:#fff;border-radius:16px;padding:1.5rem 1.25rem;margin-bottom:1rem;position:relative;border:2px solid rgba(13,148,136,.3)}
.layer-box.l2{background:linear-gradient(135deg,#fff,#F0FDFA);border-color:rgba(13,148,136,.5)}
.layer-num{position:absolute;top:-14px;left:18px;background:var(--accent);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--inter);font-weight:800;font-size:14px}
.layer-box h4{font-family:var(--serif);font-size:17px;font-weight:700;margin:.5rem 0 .75rem;color:var(--accent-dark)}
.layer-chain{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;margin:.75rem 0;font-size:12.5px}
.layer-chain .node{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:.5rem .75rem;flex:1;text-align:center;min-width:80px;color:var(--text2);font-weight:500}
.layer-chain .node.key{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600}
.layer-chain .arr{color:var(--accent);font-weight:700;padding:0 2px}
.synergy-final{background:var(--accent);color:#fff;border-radius:14px;padding:1.5rem;margin-top:1.5rem;text-align:center}
.synergy-final .lbl{font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.9;margin-bottom:.5rem}
.synergy-final p{font-family:var(--serif);font-size:16px;font-weight:700;line-height:1.6;color:#fff;margin-bottom:0}

/* FAQ */
.faq-item{background:#fff;border-radius:14px;padding:1.25rem;margin-bottom:.75rem;border:1px solid var(--line)}
.faq-q{font-size:14.5px;font-weight:700;color:var(--text);margin-bottom:.6rem;display:flex;gap:.5rem}
.faq-q::before{content:'Q.';color:var(--accent);font-family:var(--inter);font-weight:800}
.faq-a{font-size:13.5px;color:var(--text2);line-height:1.7;display:flex;gap:.5rem}
.faq-a::before{content:'A.';color:var(--coral);font-family:var(--inter);font-weight:800;flex-shrink:0}

/* 후기 */
.review-card{background:#fff;border-radius:14px;padding:1.25rem;margin-bottom:.75rem;border:1px solid var(--line)}
.review-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem}
.review-stars{color:#F59E0B;font-size:14px}
.review-user{font-size:12px;color:var(--text3);font-weight:500}
.review-card h5{font-size:14px;font-weight:700;color:var(--text);margin-bottom:.4rem}
.review-card p{font-size:13px;color:var(--text2);line-height:1.65;margin-bottom:0}

/* 가격 옵션 */
.price-option{background:#fff;border-radius:14px;padding:1.25rem;margin-bottom:.75rem;border:2px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:1rem}
.price-option.best{border-color:var(--accent);background:linear-gradient(135deg,#fff,#F0FDFA);position:relative}
.price-option.best::before{content:'BEST';position:absolute;top:-10px;right:14px;background:var(--accent);color:#fff;font-family:var(--inter);font-weight:800;font-size:10px;letter-spacing:.1em;padding:3px 10px;border-radius:10px}
.price-option .info h5{font-size:14px;font-weight:700;margin-bottom:2px;color:var(--text)}
.price-option .info .pack{font-size:11px;color:var(--text3)}
.price-option .info .save{font-size:11px;color:var(--coral);font-weight:700;margin-top:4px}
.price-option .price{text-align:right}
.price-option .price .original{font-size:12px;color:var(--text3);text-decoration:line-through}
.price-option .price .now{font-family:var(--inter);font-size:19px;font-weight:800;color:var(--text)}
.price-option.best .price .now{color:var(--accent-dark)}

/* 인증 그리드 */
.cert-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin:1.5rem 0}
.cert-card{background:#fff;border-radius:12px;padding:1rem .5rem;text-align:center;border:1px solid var(--line)}
.cert-card .ic{font-size:26px;margin-bottom:4px}
.cert-card .name{font-size:10.5px;font-weight:700;color:var(--text);line-height:1.3}

/* vs 박스 */
.vs-box{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.07);margin:1.5rem 0}
.vs-bad{background:#ffeaea;padding:1.5rem 1.25rem}
.vs-good{background:#e8faf7;padding:1.5rem 1.25rem}
.vs-bad h3{color:#d00;font-size:14px;margin-bottom:10px;font-weight:700}
.vs-good h3{color:var(--accent);font-size:14px;margin-bottom:10px;font-weight:700}
.vs-bad p,.vs-good p{font-size:13px;margin-bottom:6px;line-height:1.6;color:#333}

/* 인용 박스 */
.quote-box{background:#f0faf8;border-left:4px solid var(--accent);border-radius:0 10px 10px 0;padding:1.25rem 1.5rem;margin:1.5rem 0}
.quote-box p{color:var(--accent);font-weight:700;font-size:15px;margin-bottom:0}

/* 분리선 */
.section-divider{height:6px;background:linear-gradient(90deg,var(--accent),var(--accent-light))}
.divider-dot{text-align:center;color:var(--accent);font-size:18px;letter-spacing:1rem;padding:2.5rem 0}
.tag{display:inline-block;background:rgba(13,148,136,.12);color:var(--accent);font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:1rem;letter-spacing:.5px}
.cite{font-size:11px;color:var(--text3);font-style:italic;display:block;margin-top:4px}

/* 하단 고정 CTA */
.sticky-cta{position:sticky;bottom:0;left:0;right:0;background:rgba(10,25,41,.97);backdrop-filter:blur(12px);padding:1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));display:flex;gap:.5rem;align-items:center;border-top:1px solid var(--line-dark);z-index:100}
.sticky-cta .price-info{flex:1;color:#fff}
.sticky-cta .price-info .lbl{font-size:11px;color:var(--accent-light);letter-spacing:.1em;font-weight:600}
.sticky-cta .price-info .amount{font-family:var(--inter);font-size:19px;font-weight:800}
.sticky-cta .btn{background:var(--accent);color:#fff;padding:.85rem 1.5rem;border-radius:12px;font-weight:700;font-size:14.5px;border:none;cursor:pointer;white-space:nowrap}

@media(max-width:380px){
  section.s{padding:3rem 1.25rem}
  .compare-row .col{font-size:11px;padding:.85rem .4rem}
  .cert-grid{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>
<div class="detail-wrap">
`

export const PAGE_FLOW_HTML_TEMPLATE_CLOSE = `
</div>
</body>
</html>`

// ═══════════════════════════════════════════════════════
// 레퍼런스 모드 — 컴포넌트 가이드 없이 자유롭게 생성
// (레퍼런스 이미지/PDF가 있을 때 사용)
// ═══════════════════════════════════════════════════════

// 레퍼런스 모드용 System Prompt
export const PAGE_FLOW_REF_SYSTEM_PROMPT = `당신은 커머스 상세 페이지 카피라이터이자 HTML/CSS 개발자입니다.

레퍼런스 이미지를 보고 그 상세 페이지의 구조, 플로우, 카피 패턴, 어투를 완전히 분석합니다.
그런 다음, 분석한 구조와 어투를 그대로 따르면서 내용만 기획안의 실제 제품 정보로 채웁니다.

미리 정해진 컴포넌트나 CSS 클래스는 없습니다. 레퍼런스에서 본 구조에 맞게 자유롭게 HTML과 CSS를 작성하세요.`

// 레퍼런스 모드용 HTML 베이스 (폰트+리셋만, 컴포넌트 CSS 없음)
export const PAGE_FLOW_REF_HTML_TEMPLATE_OPEN = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>상세 페이지</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700;900&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111;
  background: #fff;
  font-size: 15px;
  line-height: 1.7;
}
.detail-wrap {
  max-width: 600px;
  margin: 0 auto;
  overflow: hidden;
  padding-bottom: 80px;
}
img { max-width: 100%; height: auto; display: block; }
</style>
</head>
<body>
<div class="detail-wrap">
`

// 레퍼런스 모드용 User Prompt
export const PAGE_FLOW_REF_USER_PROMPT = `## 출력 형식

완성된 <section> 또는 <div> 태그들만 출력한다.
**DOCTYPE·html·head·body 태그 없음. <div class="detail-wrap"> 안에 들어갈 내용만.**
섹션 고유 CSS는 각 섹션 상단에 <style> 태그로 포함하거나 style 속성으로 작성한다.

---

## 4단계로 분석한 뒤 생성

### Step 1. 섹션 구조 & 플로우 파악

레퍼런스를 처음부터 끝까지 보며 각 섹션을 순서대로 정리한다.
- 몇 개 섹션인가
- 각 섹션이 소비자에게 전달하는 핵심 메시지
- 제품을 소개하는 전체 흐름 (공감→문제→해결→증거→구매 등)
- 이미지 중심인가, 텍스트 중심인가

### Step 2. 각 섹션의 카피 계층 구조 파악

- **헤드라인**: 형식(질문/선언/수치/공감), 크기·굵기, 강조 방식, 줄바꿈 패턴
- **서브라인**: 헤드라인 위·아래 위치, 역할(보완/수식/카운터)
- **바디카피**: 길이, 단문 나열 vs 단락형, 리스트·강조 패턴
- **시각적 요소**: 아이콘, 체크마크, 숫자 뱃지, 구분선 등 반복되는 UI 패턴

### Step 3. 어투 (Tone of Voice) 파악

- 격식 수준: ~입니다/습니다 / ~에요 / ~다 (단호)
- 감성·이성 비율
- 소비자 호칭 방식
- 문장 리듬 (짧고 강렬 vs 설명적)
- 반복되는 특징적 표현 패턴

### Step 4. 레퍼런스 구조 그대로 적용하여 생성

위 분석 결과를 **모두** 적용한다.

- 섹션 수, 순서 → **레퍼런스와 동일**
- 각 섹션의 HTML 구조, 카피 계층, 시각 요소 배치 → **레퍼런스 패턴 그대로**
- 어투, 문장 리듬, 강조 방식 → **레퍼런스 Tone of Voice 그대로**
- 내용 → **기획안의 실제 제품 정보로 교체**
- CSS → **레퍼런스의 비주얼 패턴을 구현하는 CSS를 자유롭게 작성**
  - 구글 폰트(Noto Sans KR, Noto Serif KR, Inter) 사용 가능
  - 색상, 여백, 폰트 크기 등을 레퍼런스와 유사하게 설정
  - 이미지 자리는 회색 placeholder div + 이탤릭 설명으로 대체

**금지 사항**
❌ 레퍼런스에 없는 섹션 추가
❌ 레퍼런스의 흐름과 다른 순서로 배치
❌ 임의로 다른 디자인 스타일 적용

---

## 카피 작성 공통 규칙

### 소비자 언어
- 레퍼런스의 어투를 따른다
- 전문 용어는 일상 비유로 바꾼다 (단, 레퍼런스가 전문 용어를 쓴다면 따른다)

### 식약처 표현 제한
- 기능성 표현은 식약처 개별인정 원료에 한해서만 사용
- "치료·예방·치유" 절대 금지
- 임상 데이터 인용 시 출처 반드시 명시

### 없는 정보 처리
- 기획안에 없는 수치·데이터는 절대 만들지 않는다
- [데이터 필요: 항목명] 으로 표시하고 계속 작성한다

---

`

// ─────────────────────────────────────────────────────
// Claude에게 보내는 작업 프롬프트
// ─────────────────────────────────────────────────────
export const PAGE_FLOW_USER_PROMPT = `## 출력 형식

**<div class="detail-wrap"> 안에 들어갈 section 태그들만 출력한다. DOCTYPE·head·body 태그 없음.**

---

## 레퍼런스가 있을 때 — 3단계 분석 후 생성

레퍼런스(스크린샷 이미지 또는 PDF)가 제공된 경우, 바로 쓰지 말고 아래 순서대로 분석한 뒤 생성한다.

### Step 1. 섹션 구조 & 플로우 분석

레퍼런스의 각 섹션을 처음부터 끝까지 순서대로 파악한다.

각 섹션에 대해 정리할 것:
- **섹션 번호 & 역할**: 이 섹션이 소비자에게 전달하는 핵심 메시지는 무엇인가
- **제품 소개 흐름**: 어떤 순서로 제품을 소개하는가 (공감 → 문제 → 해결 → 증거 → 구매 등)
- **이미지·텍스트 비율**: 이 섹션에서 이미지가 주인가, 텍스트가 주인가

### Step 2. 카피 계층 구조 분석

각 섹션에서 텍스트가 어떻게 계층을 이루는지 파악한다.

- **헤드라인 (Headline)**
  - 형식: 질문형인가? 선언형인가? 숫자/통계형인가? 공감 유도형인가?
  - 크기·비중: 얼마나 크고 굵은가 (다른 텍스트 대비)
  - 강조 방식: 색상 강조, 줄바꿈 위치, 핵심 키워드 강조 등

- **서브라인 (Sub-line)**
  - 헤드라인 위에 오는가, 아래에 오는가
  - 헤드라인을 어떻게 보완하는가 (배경 설명? 수식? 카운터 포인트?)

- **바디카피 (Body copy)**
  - 길이: 짧고 강렬한가 vs 상세하게 설명하는가
  - 문장 구조: 단문 나열인가 vs 단락형인가
  - 특징적 패턴: 리스트, 강조 키워드, 수치 인용 방식 등

### Step 3. 어투 (Tone of Voice) 분석

레퍼런스 전체를 관통하는 말투와 감정 톤을 파악한다.

- **격식 수준**: ~입니다/습니다 (격식) vs ~에요/아요 (친근) vs ~다 (단호)
- **감성·이성 비율**: 공감·감정 자극이 많은가 vs 데이터·근거 중심인가
- **소비자 호칭**: "당신", "여러분", 호칭 없음 등
- **문장 리듬**: 짧은 문장이 강하게 끊기는가 vs 흐르듯 긴 문장인가
- **특징적 어휘·표현**: 레퍼런스에서 반복되는 키워드, 독특한 표현 방식

---

### Step 4. 분석 결과를 기획안에 적용하여 생성

위 분석에서 파악한 내용을 모두 적용하여 생성한다.

- 섹션 수, 순서, 각 섹션의 역할 → **레퍼런스와 동일하게**
- 각 섹션의 헤드라인 형식, 서브라인 위치, 바디카피 길이 → **레퍼런스 패턴 그대로**
- 어투, 문장 리듬, 강조 방식 → **레퍼런스 Tone of Voice 그대로**
- 내용만 → **기획안의 실제 제품 정보로 채운다**

❌ 디자인(색상·폰트) 복사 금지
❌ 레퍼런스에 없는 섹션 임의 추가 금지
✅ 구조, 카피 계층, 어투는 최대한 충실히 재현

---

## 레퍼런스가 없을 때 — 기본 구성

1. **메인 배너** (.hero 또는 .s.dark) — 제품명 + 핵심 후크 h1
2. **타겟 공감** (.s 또는 .s.cream) — .pain-list 활용
3. **진짜 원인 / 문제 정의** (.s.dark) — big-stat, vs-box 활용
4. **제품 차별점 / 메커니즘** (.s.mint) — layer-box 또는 card+step 활용
5. **핵심 성분** (.s) — .ingredient.main + .ingredient 활용
6. **임상 근거** (.s.dark 또는 .s.mint) — bar-chart, authority-card 활용
7. **변화 타임라인** (.s) — .timeline 활용
8. **사용법** (.s.cream) — card+step 활용
9. **FAQ** (.s) — .faq-item 활용
10. **구매 CTA** (.s.dark) — .price-option, sticky-cta 포함

---

## 카피 작성 공통 규칙

### 소비자 언어
- 판단 기준: "초등·중학생도 읽으면 바로 이해되는가"
- 전문 용어 → 일상 경험·비유로 바꾼다
- 레퍼런스가 있으면 레퍼런스의 언어 수준·어투를 따른다

### 식약처 표현 제한
- 기능성 표현은 식약처 개별인정 원료에 한해서만 사용
- "치료·예방·치유" 절대 금지
- 임상 데이터 인용 시 출처 반드시 명시

### 없는 정보 처리
- 기획안에 없는 수치·데이터는 절대 만들지 않는다
- [데이터 필요: 항목명] 으로 표시하고 계속 작성한다

---

`
