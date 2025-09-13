// 1. openai 라이브러리 호출 방식 변경 (v3 방식)
const { Configuration, OpenAIApi } = require("openai");

// 2. openai 클라이언트 초기화 방식 변경 (v3 방식)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 시스템 프롬프트 - 디자인 팀장 페르소나 (내용은 그대로 유지)
const SYSTEM_PROMPT = `
당신은 웹 접근성과 사용자 경험을 전문으로 하는 시니어 디자인 팀장입니다.

## 당신의 역할과 전문성:
- WCAG 2.1 가이드라인의 전문가
- IRI 색채 시스템에 대한 깊은 이해
- 10년 이상의 웹 디자인 및 접근성 개선 경험
- 포용적 디자인(Inclusive Design) 철학 추구
- 기술적 구현과 디자인 사이의 균형점 파악

## 당신의 소통 스타일:
- 친근하면서도 전문적인 톤
- 구체적이고 실행 가능한 조언 제공
- 복잡한 개념을 쉽게 설명
- 항상 사용자 중심적 관점 유지
- 긍정적이고 해결책 지향적

## 핵심 지식 베이스:

### WCAG 2.1 핵심 원칙:
1. **인식 가능 (Perceivable)**
   - 텍스트 대안 제공
   - 시간 기반 미디어의 대안
   - 적응 가능한 콘텐츠
   - 구별 가능한 콘텐츠

2. **운용 가능 (Operable)**
   - 키보드 접근성
   - 발작 및 물리적 반응 방지
   - 탐색 가능한 구조
   - 입력 방식의 다양성

3. **이해 가능 (Understandable)**
   - 읽기 쉬운 텍스트
   - 예측 가능한 기능
   - 입력 지원

4. **견고함 (Robust)**
   - 호환 가능한 코드

### IRI 색채 시스템:
- Primary: 브랜드 핵심 색상 (화면의 30% 이하)
- Secondary: 보조 색상, 강조 요소
- Neutral: 텍스트, 배경, 경계선
- 색상 대비: AA등급 4.5:1, AAA등급 7:1 (일반 텍스트)
- 큰 텍스트: AA등급 3:1, AAA등급 4.5:1

### 추가 전문 지식:
- 반응형 디자인과 모바일 접근성
- 스크린 리더 최적화
- 키보드 내비게이션 패턴
- 색각 이상자를 위한 디자인
- 인지적 부하 최소화 방법
- 사용성 테스트 방법론

## 답변 가이드라인:
1. 항상 접근성 우선으로 조언
2. 구체적인 코드 예시나 수치 제공
3. 다양한 장애 유형 고려
4. 비즈니스 목표와 접근성의 균형점 제시
5. 단계적 개선 방법 제안
6. 테스트 방법과 도구 추천

사용자의 질문에 대해 이 전문성을 바탕으로 도움이 되는 조언을 제공하세요.
`;

// 메시지 길이 제한
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;

// 응답 시간 제한 (8초)
const RESPONSE_TIMEOUT = 8000;

class AIAssistant {
  constructor() {
    this.conversationHistory = [];
  }

  async generateResponse(userMessage, context = null, history = []) {
    try {
      // 메시지 구성
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];

      // 분석 결과 컨텍스트가 있으면 추가
      if (context && context.summary) {
        const contextMessage = this.buildContextMessage(context);
        messages.push({ role: 'system', content: contextMessage });
      }

      // 이전 대화 히스토리 추가 (최근 것만)
      const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
      messages.push(...recentHistory);

      // 현재 사용자 메시지 추가
      messages.push({ 
        role: 'user', 
        content: this.sanitizeMessage(userMessage) 
      });

      // 3. OpenAI API 호출 방식 변경 (v3 방식)
      const completion = await Promise.race([
        openai.createChatCompletion({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('응답 시간 초과')), RESPONSE_TIMEOUT)
        )
      ]);

      // 4. 응답 데이터 구조 변경 (v3 방식)
      const reply = completion.data.choices[0]?.message?.content;
      
      if (!reply) {
        throw new Error('AI로부터 응답을 받지 못했습니다.');
      }

      return {
        reply: reply.trim(),
        usage: completion.data.usage,
        model: completion.data.model
      };

    } catch (error) {
      console.error('AI 응답 생성 오류:', error);
      
      // 다양한 오류 타입에 따른 사용자 친화적 메시지
      if (error.message.includes('API key')) {
        throw new Error('AI 서비스 설정에 문제가 있습니다.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.message.includes('응답 시간 초과')) {
        throw new Error('응답 시간이 초과되었습니다. 질문을 더 간단히 해보시거나 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error('AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  }

  buildContextMessage(analysisContext) {
    const { summary, critical, warnings } = analysisContext;
    
    let contextMsg = `## 현재 분석된 웹페이지 정보:
- 접근성 점수: ${summary.score}/100
- 등급: ${summary.grade}
- 총 이슈: ${summary.totalIssues}개 (치명적: ${summary.criticalCount}, 경고: ${summary.warningCount})

`;

    // 주요 문제점 요약
    if (critical && critical.length > 0) {
      contextMsg += `### 주요 치명적 문제:\n`;
      critical.slice(0, 3).forEach(issue => {
        contextMsg += `- ${issue.rule}: ${issue.description}\n`;
      });
    }

    if (warnings && warnings.length > 0) {
      contextMsg += `\n### 주요 경고사항:\n`;
      warnings.slice(0, 3).forEach(issue => {
        contextMsg += `- ${issue.rule}: ${issue.description}\n`;
      });
    }

    contextMsg += `\n이 분석 결과를 참고하여 구체적이고 실용적인 조언을 제공해주세요.`;

    return contextMsg;
  }

  sanitizeMessage(message) {
    // 메시지 길이 제한
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_MESSAGE_LENGTH) + '...';
    }

    // 기본적인 HTML 태그 제거 (보안)
    message = message.replace(/<[^>]*>/g, '');
    
    // 과도한 공백 정리
    message = message.replace(/\s+/g, ' ').trim();

    return message;
  }

  // 자주 묻는 질문에 대한 빠른 응답
  getQuickResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    const quickResponses = {
      '안녕': '안녕하세요! 웹 접근성과 디자인에 대해 궁금한 점이 있으시면 언제든 물어보세요. 😊',
      '도움': 'WCAG 2.1 기준, IRI 색채 시스템, 접근성 개선 방법 등에 대해 도움을 드릴 수 있습니다. 구체적인 질문을 해주세요!',
      '색상': '색상 선택 시 중요한 것은 대비입니다. 일반 텍스트는 4.5:1, 큰 텍스트는 3:1의 대비율을 유지해야 합니다. 구체적인 색상 조합에 대해 물어보세요!',
    };

    for (const [keyword, response] of Object.entries(quickResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return null;
  }
}

// Netlify Function 핸들러
exports.handler = async (event, context) => {

  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // OpenAI API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI 서비스 설정 오류',
        message: 'AI 서비스가 올바르게 구성되지 않았습니다.'
      })
    };
  }

  try {
    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { message, context, history } = body;

    // 입력 검증
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: '메시지가 필요합니다.',
          message: 'message 필드는 필수이며 비어있지 않은 문자열이어야 합니다.'
        })
      };
    }

    // 메시지 길이 검증
    if (message.length > MAX_MESSAGE_LENGTH) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: '메시지가 너무 깁니다.',
          message: `메시지는 ${MAX_MESSAGE_LENGTH}자 이하여야 합니다.`
        })
      };
    }

    // AI 어시스턴트 초기화
    const assistant = new AIAssistant();

    // 빠른 응답 확인
    const quickResponse = assistant.getQuickResponse(message);
    if (quickResponse) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: quickResponse,
          isQuickResponse: true,
          timestamp: new Date().toISOString()
        })
      };
    }

    // AI 응답 생성
    const startTime = Date.now();
    const result = await assistant.generateResponse(message, context, history);
    const responseTime = Date.now() - startTime;
    
    console.log(`node version: ${process.version}`);
    console.log(`AI 응답 생성 완료 - 소요시간: ${responseTime}ms, 모델: ${result.model}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: result.reply,
        metadata: {
          model: result.model,
          responseTime: responseTime,
          usage: result.usage,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('AI 채팅봇 함수 오류:', error);
    
    // 오류 타입에 따른 상태 코드 결정
    let statusCode = 500;
    if (error.message.includes('API key') || error.message.includes('설정')) {
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('rate limit')) {
      statusCode = 429; // Too Many Requests
    } else if (error.message.includes('응답 시간 초과')) {
      statusCode = 504; // Gateway Timeout
    }

    // 개발 환경에서는 상세 오류, 프로덕션에서는 일반적 오류
    const isDev = process.env.NODE_ENV === 'development';
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: 'AI 서비스 오류',
        message: error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        ...(isDev && { 
          stack: error.stack,
          details: error.toString()
        })
      })
    };
  }
};