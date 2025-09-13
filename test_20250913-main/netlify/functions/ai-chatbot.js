// [파일: ai-chatbot.js]
// 역할: OpenAI API를 사용하여 AI 챗봇의 응답을 생성하는 서버리스 함수.

// --- 1. 기본 설정 및 AI 초기화 ---

// openai 라이브러리. AI 모델 사용의 핵심.
const { Configuration, OpenAIApi } = require("openai");

// OpenAI API 인증 정보 구성.
// process.env.OPENAI_API_KEY: Netlify 서버에 저장된 환경 변수(API 키)를 참조.
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// --- 2. AI의 역할과 성격을 정의하는 시스템 프롬프트 ---

// AI의 정체성(Persona)과 응답 방향성을 규정하는 시스템 프롬프트.
// 이 지시문을 기반으로 일관된 톤과 전문성을 유지.
const SYSTEM_PROMPT = `
당신은 웹 접근성과 사용자 경험을 전문으로 하는 시니어 디자인 팀장임.

## 당신의 역할과 전문성:
- WCAG 2.1 가이드라인의 전문가
//...(이하 내용 동일)...
`;

// --- 3. 챗봇 동작을 위한 규칙( 상수) 설정 ---

// 최대 메시지 길이. 사용자 입력값 제한. (2000자)
const MAX_MESSAGE_LENGTH = 2000;
// 최대 대화 기록. API 요청에 포함할 이전 대화의 수. 토큰 사용량 제어 목적.
const MAX_HISTORY_MESSAGES = 10;
// 응답 제한 시간. 8초 초과 시 타임아웃 처리.
const RESPONSE_TIMEOUT = 8000;

// --- 4. AI 챗봇의 핵심 기능을 담당하는 클래스 ---

class AIAssistant {
  // 생성자. 현재는 특별한 초기화 로직 없음.
  constructor() {
    this.conversationHistory = [];
  }

  // AI 응답 생성 비동기 함수.
  async generateResponse(userMessage, context = null, history = []) {
    try {
      // --- 4-1. AI API 요청을 위한 메시지 배열 구성 ---

      // 1. 시스템 프롬프트: AI의 역할 정의.
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];

      // 2. 컨텍스트 메시지: 분석 결과(context)가 존재할 경우, 시스템 메시지로 추가 주입.
      if (context && context.summary) {
        const contextMessage = this.buildContextMessage(context);
        messages.push({ role: 'system', content: contextMessage });
      }

      // 3. 대화 기록: 이전 대화를 추가하여 문맥 유지.
      const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
      messages.push(...recentHistory);

      // 4. 사용자 메시지: 현재 사용자 질문 추가. 보안을 위해 정제(sanitize) 처리.
      messages.push({
        role: 'user',
        content: this.sanitizeMessage(userMessage)
      });

      // --- 4-2. OpenAI API 호출 및 응답 시간 제어 ---

      // Promise.race: API 요청과 타임아웃 타이머를 경쟁시켜 빠른 쪽을 채택.
      const completion = await Promise.race([
        // OpenAI ChatCompletion API 호출.
        openai.createChatCompletion({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // 사용할 AI 모델.
          messages, // 구성된 전체 메시지 배열.
          max_tokens: 1000, // 응답 최대 길이.
          temperature: 0.7, // 응답의 창의성. (0.0 ~ 2.0)
        }),
        // 지정된 시간(RESPONSE_TIMEOUT) 후 오류를 발생시키는 타이머.
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('응답 시간 초과')), RESPONSE_TIMEOUT)
        )
      ]);

      // --- 4-3. AI 응답 결과 처리 ---

      // API 응답 데이터에서 실제 텍스트 내용만 추출.
      const reply = completion.data.choices[0]?.message?.content;

      // 응답 내용이 없을 경우 예외 처리.
      if (!reply) {
        throw new Error('AI로부터 응답을 받지 못했음.');
      }

      // 최종 결과 객체 반환.
      return {
        reply: reply.trim(),
        usage: completion.data.usage, // 토큰 사용량 정보.
        model: completion.data.model // 사용된 모델 정보.
      };

    } catch (error) {
      // 오류 유형에 따른 사용자 친화적 예외 메시지 생성.
      console.error('AI 응답 생성 오류:', error);
      if (error.message.includes('API key')) {
        throw new Error('AI 서비스 설정 문제 발생.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('요청량 초과. 잠시 후 재시도 필요.');
      } else if (error.message.includes('응답 시간 초과')) {
        throw new Error('응답 시간 초과. 질문을 단순화하거나 잠시 후 재시도 필요.');
      } else {
        throw new Error('AI 서비스 일시적 문제 발생. 잠시 후 재시도 필요.');
      }
    }
  }

  // 분석 결과(context)를 AI가 이해할 형식의 텍스트로 변환.
  buildContextMessage(analysisContext) {
    const { summary, critical, warnings } = analysisContext;
    let contextMsg = `## 현재 분석된 웹페이지 정보:\n- 접근성 점수: ${summary.score}/100\n- 등급: ${summary.grade}\n`;
    // ... (분석 결과 요약 로직)
    return contextMsg;
  }

  // 사용자 입력값 정제(Sanitization). XSS 방지 및 입력 길이 제한.
  sanitizeMessage(message) {
    // 길이 제한.
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_MESSAGE_LENGTH) + '...';
    }
    // HTML 태그 제거.
    message = message.replace(/<[^>]*>/g, '');
    // 연속된 공백 제거.
    message = message.replace(/\s+/g, ' ').trim();
    return message;
  }

  // 간단한 키워드에 대해 미리 정의된 답변을 반환. API 비용 절감.
  getQuickResponse(message) {
    const lowerMessage = message.toLowerCase();
    const quickResponses = { '안녕': '안녕하세요! ...' };
    // ... (키워드 매칭 로직)
    return null;
  }
}

// --- 5. Netlify 서버리스 함수의 메인 핸들러 (진입점) ---
exports.handler = async (event, context) => {

  // --- 5-1. 기본 서버 설정 및 보안 검사 ---
  const headers = { 'Access-Control-Allow-Origin': '*' }; // CORS 헤더.
  if (event.httpMethod !== 'POST') { // POST 메서드만 허용.
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (!process.env.OPENAI_API_KEY) { // API 키 존재 여부 확인.
    return { statusCode: 500, body: JSON.stringify({ error: 'AI 서비스 설정 오류' }) };
  }

  try {
    // --- 5-2. 사용자 요청 처리 ---
    const body = JSON.parse(event.body || '{}');
    const { message, context, history } = body;

    // 입력값 유효성 검사.
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: '메시지가 필요함.' }) };
    }

    // --- 5-3. AI 호출 및 결과 반환 ---
    const assistant = new AIAssistant();

    // 빠른 응답 우선 확인.
    const quickResponse = assistant.getQuickResponse(message);
    if (quickResponse) {
      return { statusCode: 200, headers, body: JSON.stringify({ reply: quickResponse }) };
    }

    // AI 응답 생성.
    const result = await assistant.generateResponse(message, context, history);

    // 클라이언트에게 최종 응답 반환.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: result.reply, metadata: { ... } })
    };

  } catch (error) {
    // --- 5-4. 핸들러 레벨의 최종 오류 처리 ---
    console.error('AI 채팅봇 함수 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI 서비스 오류', message: error.message })
    };
  }
};