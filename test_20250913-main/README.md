Markdown

# 접근성 디자인 어시스턴트 🎨♿

WCAG 2.1 및 IRI 색채 시스템 기반의 HTML 접근성 분석 및 AI 디자인 어시스턴트 웹 애플리케이션

---

### 🌟 주요 기능

#### 📊 HTML 접근성 분석기
- **정량적 분석:** Cheerio와 TinyColor2를 활용한 코드 레벨 분석
- **WCAG 2.1 준수:** 4대 원칙 기반 종합적 접근성 평가
- **실시간 피드백:** 치명적 문제, 경고사항, 개선 제안 단계별 분류
- **점수 산정:** 100점 만점의 접근성 점수 및 등급 제공

#### 🤖 AI 디자인 어시스턴트
- **대화형 색상 추천:** 버튼 기반의 시나리오를 통해 사용자에게 최적화된 메인 컬러 및 텍스트 색상을 추천
- **전문가 페르소나:** 시니어 디자인 팀장 역할의 AI
- **맥락적 조언:** 분석 결과를 기반으로 한 맞춤형 상담
- **실용적 해결책:** 구체적이고 실행 가능한 개선 방안 제시

#### 🎨 IRI 색채 시스템
- **과학적 접근:** 색상 이론 기반의 체계적 색채 선택
- **접근성 최우선:** WCAG 대비 기준을 만족하는 색상 팔레트
- **브랜드 조화:** 업종별 특성을 고려한 색상 조합 추천

---

### 🏗️ 기술 스택

#### 프론트엔드
- **HTML5:** 시맨틱 마크업과 접근성 표준 준수
- **CSS3:** Pretendard 폰트, CSS Grid, Flexbox, CSS 변수
- **Vanilla JavaScript:** 모던 ES6+ 문법, 상태 관리를 포함한 모듈화된 구조
- **반응형 디자인:** 모바일 퍼스트 접근법

#### 백엔드 (Serverless)
- **Netlify Functions:** Node.js 18 기반 서버리스 API
- **Cheerio:** HTML 파싱 및 DOM 조작
- **TinyColor2:** 색상 분석 및 대비 계산
- **OpenAI API:** GPT 기반 AI 어시스턴트

#### 데이터베이스
- **JSON 기반:** `rules.json`을 통한 Ground Truth 구현
- **RAG 패턴:** AI 환각 현상 방지를 위한 지식 베이스

---

### 🚀 설치 및 실행

**사전 요구사항**
- Node.js >= 18.0.0
- npm >= 9.0.0

**1. 저장소 클론**
```bash
git clone [https://github.com/fffx2/test_20250913-main.git](https://github.com/fffx2/test_20250913-main.git)
cd test_20250913-main
2. 의존성 설치

Bash

npm install
3. 환경 변수 설정

Bash

# .env 파일 생성
cp .env.example .env

# .env 파일에 OpenAI API 키 설정 (필수)
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
4. 로컬 개발 서버 실행

Bash

npm run dev
→ http://localhost:8888 에서 확인

🌐 Netlify 배포
자동 배포 (권장)

GitHub에 코드 푸시

Netlify에서 GitHub 저장소 연결

빌드 설정:

Build command: npm run build

Publish directory: public

Functions directory: netlify/functions

환경 변수 설정:

OPENAI_API_KEY: OpenAI API 키

NODE_ENV: production

📁 프로젝트 구조
test_20250913-main/
├── public/                          # 정적 파일 (배포 대상)
│   ├── index.html                   # 메인 HTML
│   ├── css/
│   │   └── styles.css              # 메인 스타일시트
│   ├── js/
│   │   └── app.js                  # 프론트엔드 로직 및 상태 관리
│   └── data/
│       └── rules.json              # WCAG & IRI 규칙 DB
├── netlify/
│   └── functions/                   # 서버리스 함수
│       ├── analyze-html.js         # HTML 분석 API
│       └── ai-chatbot.js           # AI 채팅 및 색상 추천 시나리오 API
├── netlify.toml                     # Netlify 설정
├── package.json                     # 프로젝트 설정
├── build.js                         # 빌드 스크립트
├── .env.example                     # 환경 변수 예시
├── .gitignore                       # Git 무시 파일
└── README.md                        # 프로젝트 문서
🔧 API 엔드포인트
HTML 분석 API
POST /.netlify/functions/analyze-html

Request Body:

JSON

{
  "html": "<html>...</html>",
  "filename": "index.html"
}
AI 채팅 및 색상 추천 API
POST /.netlify/functions/ai-chatbot

Request Body:

JSON

{
  "message": "사용자 입력 또는 버튼 값",
  "state": { "step": "current_step", "...": "..." },
  "context": { /* 분석 결과 (선택 사항) */ },
  "history": [ /* 이전 대화 (선택 사항) */ ]
}
Response 예시 (버튼 포함 시):

JSON

{
  "reply": "다음 질문에 답변해주세요.",
  "buttons": ["선택지 1", "선택지 2"],
  "state": { "step": "next_step", "...": "..." }
}
♿ 접근성 특징
WCAG 2.1 AA 준수: 색상 대비, 키보드 접근, 스크린 리더 지원 등

Skip Link: 메인 콘텐츠로 바로가기

Focus Management: 명확한 포커스 표시

Live Regions: 동적 콘텐츠 변경 알림

High Contrast Mode & Reduced Motion: 사용자 시스템 설정 존중