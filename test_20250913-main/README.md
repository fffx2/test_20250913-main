# 접근성 디자인 어시스턴트 🎨♿

WCAG 2.1 및 IRI 색채 시스템 기반의 HTML 접근성 분석 및 AI 디자인 어시스턴트 웹 애플리케이션

## 🌟 주요 기능

### 📊 HTML 접근성 분석기
- **정량적 분석**: Cheerio와 TinyColor2를 활용한 코드 레벨 분석
- **WCAG 2.1 준수**: 4대 원칙 기반 종합적 접근성 평가
- **실시간 피드백**: 치명적 문제, 경고사항, 개선 제안 단계별 분류
- **점수 산정**: 100점 만점의 접근성 점수 및 등급 제공

### 🤖 AI 디자인 어시스턴트
- **전문가 페르소나**: 시니어 디자인 팀장 역할의 AI
- **맥락적 조언**: 분석 결과를 기반으로 한 맞춤형 상담
- **실용적 해결책**: 구체적이고 실행 가능한 개선 방안 제시
- **지속적 학습**: 대화 히스토리를 통한 연속적 상담

### 🎨 IRI 색채 시스템
- **과학적 접근**: 색상 이론 기반의 체계적 색채 선택
- **접근성 최우선**: WCAG 대비 기준을 만족하는 색상 팔레트
- **브랜드 조화**: 업종별 특성을 고려한 색상 조합 추천

## 🏗️ 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업과 접근성 표준 준수
- **CSS3**: Pretendard 폰트, CSS Grid, Flexbox
- **Vanilla JavaScript**: 모던 ES6+ 문법, 모듈화된 구조
- **반응형 디자인**: 모바일 퍼스트 접근법

### 백엔드 (Serverless)
- **Netlify Functions**: Node.js 18 기반 서버리스 API
- **Cheerio**: HTML 파싱 및 DOM 조작
- **TinyColor2**: 색상 분석 및 대비 계산
- **OpenAI API**: GPT 기반 AI 어시스턴트

### 데이터베이스
- **JSON 기반**: `rules.json`을 통한 Ground Truth 구현
- **RAG 패턴**: AI 환각 현상 방지를 위한 지식 베이스

## 🚀 설치 및 실행

### 사전 요구사항
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/accessibility-design-assistant.git
cd accessibility-design-assistant
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# OpenAI API 키 설정 (필수)
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
```

### 4. 로컬 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:8888 에서 확인

### 5. 프로덕션 빌드
```bash
npm run build
```

## 🌐 Netlify 배포

### 자동 배포 (권장)
1. GitHub에 코드 푸시
2. [Netlify](https://netlify.com)에서 GitHub 저장소 연결
3. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
4. 환경 변수 설정:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `NODE_ENV`: `production`

### 수동 배포
```bash
# Netlify CLI 설치 (전역)
npm install -g netlify-cli

# 로그인
netlify login

# 배포
npm run deploy
```

## 📁 프로젝트 구조

```
accessibility-design-assistant/
├── public/                          # 정적 파일 (배포 대상)
│   ├── index.html                   # 메인 HTML
│   ├── css/
│   │   └── styles.css              # 메인 스타일시트
│   ├── js/
│   │   └── app.js                  # 메인 JavaScript
│   └── data/
│       └── rules.json              # WCAG & IRI 규칙 DB
├── netlify/
│   └── functions/                   # 서버리스 함수
│       ├── analyze-html.js         # HTML 분석 API
│       ├── ai-chatbot.js          # AI 채팅 API
│       └── recommend-design.js     # 디자인 추천 API
├── netlify.toml                     # Netlify 설정
├── package.json                     # 프로젝트 설정
├── build.js                         # 빌드 스크립트
├── .env.example                     # 환경 변수 예시
├── .gitignore                       # Git 무시 파일
└── README.md                        # 프로젝트 문서
```

## 🔧 API 엔드포인트

### HTML 분석 API
```http
POST /.netlify/functions/analyze-html
Content-Type: application/json

{
  "html": "<html>...</html>",
  "filename": "index.html"
}
```

**응답 예시:**
```json
{
  "summary": {
    "score": 85,
    "grade": "AA (양호)",
    "totalIssues": 3
  },
  "critical": [],
  "warnings": [
    {
      "rule": "색상 대비 부족",
      "description": "대비가 3.2:1로 기준 미달",
      "suggestion": "텍스트 색상을 더 어둡게 조정하세요"
    }
  ]
}
```

### AI 채팅 API
```http
POST /.netlify/functions/ai-chatbot
Content-Type: application/json

{
  "message": "색상 대비를 개선하는 방법을 알려주세요",
  "context": { /* 분석 결과 */ },
  "history": [ /* 이전 대화 */ ]
}
```

### 디자인 추천 API
```http
POST /.netlify/functions/recommend-design
Content-Type: application/json

{
  "analysisResults": { /* 분석 결과 */ },
  "preferences": {
    "industry": "healthcare",
    "accessibilityLevel": "AA"
  }
}
```

## 🎨 디자인 시스템

### 색상 팔레트
```css
:root {
  /* Primary Colors - WCAG AA 준수 */
  --color-primary: #0066cc;        /* 대비: 5.89:1 */
  --color-secondary: #28a745;      /* 대비: 4.56:1 */
  
  /* Neutral Scale */
  --color-neutral-900: #212529;    /* 대비: 16.75:1 */
  --color-neutral-700: #495057;
  --color-neutral-500: #6c757d;
  --color-neutral-300: #dee2e6;
  --color-neutral-100: #f8f9fa;
  --color-neutral-50: #ffffff;
}
```

### 타이포그래피
- **기본 폰트**: Pretendard Variable (웹폰트)
- **기본 크기**: 16px (1rem)
- **줄 간격**: 1.6 (WCAG 권장 1.5 이상)
- **모바일 최소 크기**: 16px (확대 없이 읽기 가능)

### 간격 시스템
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

## ♿ 접근성 특징

### WCAG 2.1 AA 준수
- ✅ **색상 대비**: 모든 텍스트 4.5:1 이상
- ✅ **키보드 접근**: 모든 상호작용 요소 접근 가능
- ✅ **스크린 리더**: ARIA 라벨 및 시맨틱 마크업
- ✅ **반응형**: 320px~1920px 모든 해상도 지원

### 추가 접근성 기능
- **Skip Link**: 메인 콘텐츠로 바로가기
- **Focus Management**: 명확한 포커스 표시
- **Live Regions**: 동적 콘텐츠 변경 알림
- **High Contrast Mode**: 고대비 모드 지원
- **Reduced Motion**: 애니메이션 줄이기 지원

## 🔍 테스트 및 검증

### 자동화된 테스트
```bash
# 접근성 테스트 (권장 도구)
npm install -g @axe-core/cli
axe http://localhost:8888

# Lighthouse 접근성 점수 확인
lighthouse http://localhost:8888 --only-categories=accessibility
```

### 수동 테스트 체크리스트
- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] 스크린 리더로 콘텐츠 이해 가능
- [ ] 200% 확대 시에도 레이아웃 유지
- [ ] 색상 없이도 정보 전달 가능
- [ ] 모든 이미지에 적절한 대체 텍스트

## 🐛 문제 해결

### 일반적인 이슈

**1. Functions 502 오류**
```bash
# 원인: Netlify 무료 플랜 10초 제한
# 해결: 코드 최적화 또는 유료 플랜 사용
```

**2. OpenAI API 오류**
```bash
# 환경 변수 확인
echo $OPENAI_API_KEY

# API 키 유효성 확인
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

**3. 빌드 실패**
```bash
# Node.js 버전 확인 (18 이상 필요)
node --version

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 성능 최적화

**이미지 최적화**
- WebP 포맷 사용
- 적절한 크기로 리사이징
- lazy loading 적용

**JavaScript 최적화**
- 번들 크기 최소화
- 코드 분할 적용
- 캐싱 전략 활용

## 📈 성능 지표

### 목표 성능
- **Lighthouse 점수**: 90+ (모든 카테고리)
- **접근성 점수**: 100점
- **First Content Paint**: < 1.5초
- **페이지 로드 시간**: < 3초

### 모니터링
```bash
# 성능 측정
lighthouse http://localhost:8888 --output=json
```

## 🤝 기여하기

### 개발 환경 설정
1. 이슈 확인 및 할당 요청
2. 브랜치 생성: `git checkout -b feature/새로운기능`
3. 코드 작성 및 테스트
4. 커밋: `git commit -m "feat: 새로운 기능 추가"`
5. PR 생성

### 코딩 컨벤션
- **JavaScript**: ESLint + Prettier
- **CSS**: BEM 방법론
- **HTML**: 시맨틱 마크업 필수
- **접근성**: 모든 변경사항 WCAG 2.1 AA 준수

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 🙏 감사의 말

- **Pretendard**: 아름다운 한글 웹폰트 제공
- **WCAG Working Group**: 웹 접근성 표준 개발
- **OpenAI**: AI 어시스턴트 기술 제공
- **Netlify**: 무료 서버리스 호스팅 서비스

---

## 📞 연락처

- **이슈 보고**: [GitHub Issues](https://github.com/your-username/accessibility-design-assistant/issues)
- **기능 제안**: [GitHub Discussions](https://github.com/your-username/accessibility-design-assistant/discussions)

**모든 사용자를 위한 포용적인 웹을 만들어 갑시다! 🌍♿🎨**