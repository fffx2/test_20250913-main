/* [파일: ai-chatbot.js] */
/* 역할: '색상 추천' 시나리오 처리 및 일반 대화 시 OpenAI 응답 생성을 담당하는 서버리스 함수. */

const { Configuration, OpenAIApi } = require("openai");
const tinycolor = require('tinycolor2'); // 명도 대비 계산을 위해 tinycolor 라이브러리 추가.

// ... (기존 OpenAI 설정 부분은 동일) ...
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);


// --- 1. 색상 추천을 위한 데이터베이스 ---
const COLOR_SYSTEM = {
    'soft-dynamic': {
        title: '부드럽고 동적인',
        keywords: { '귀여운': '#F8F2A1', '경쾌한': '#F0E442', '즐거운': '#FAD8A6', '사랑스러운': '#F05A8D', '아기자기한': '#F8C6CF', '재미있는': '#F9A637' }
    },
    'soft-static': {
        title: '부드럽고 정적인',
        keywords: { '깨끗한': '#E9F3F8', '맑은': '#97D4E9', '은은한': '#E4DDC8', '수수한': '#D3D3C1', '내추럴한': '#C8B68E', '부드러운': '#F1EBE0' }
    },
    'hard-dynamic': {
        title: '딱딱하고 동적인',
        keywords: { '화려한': '#E94868', '다이나믹한': '#D53A30', '모던한': '#4D54A0', '스포티한': '#E69F00', '개성적인': '#4D54A0', '하이테크한': '#231F20' }
    },
    'hard-static': {
        title: '딱딱하고 정적인',
        keywords: { '클래식한': '#5A3B3C', '점잖은': '#766A65', '고상한': '#A694B6', '우아한': '#A694B6', '격식있는': '#2B2B2B', '이성적인': '#0072B2' }
    }
};

// --- 2. 새로운 색상 추천 로직 ---

// 헥사 코드 유효성 검사 함수.
const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);

// 명도 대비 분석 함수.
const analyzeContrast = (hex) => {
    if (!isValidHex(hex)) {
        return { error: '올바른 헥사 코드(예: #FFFFFF)를 입력해주세요.' };
    }

    const mainColor = tinycolor(hex);
    const white = tinycolor('#FFFFFF');
    const darkText = tinycolor('#212529');

    const contrastWithWhite = tinycolor.readability(mainColor, white).toFixed(2);
    const contrastWithDarkText = tinycolor.readability(mainColor, darkText).toFixed(2);

    const whiteMeetsAA = contrastWithWhite >= 4.5;
    const darkTextMeetsAA = contrastWithDarkText >= 4.5;

    let result = `입력하신 \`${hex}\` 색상 기준, 추천 텍스트 색상은 다음과 같아요.\n\n`;
    result += `* **어두운 텍스트(#212529):** 명도 대비 **${contrastWithDarkText}:1** (${darkTextMeetsAA ? '✅ AA 등급 만족' : '❌ AA 등급 미달'})\n`;
    result += `* **밝은 텍스트(#FFFFFF):** 명도 대비 **${contrastWithWhite}:1** (${whiteMeetsAA ? '✅ AA 등급 만족' : '❌ AA 등급 미달'})\n\n`;
    result += `본문 텍스트는 AA등급(4.5:1) 이상을 권장합니다.`;
    
    return { reply: result };
};

// --- 3. 메인 핸들러 (로직 수정) ---

exports.handler = async (event, context) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (event.httpMethod === 'OPTIONS') { return { statusCode: 200, headers, body: '' }; }
    if (event.httpMethod !== 'POST') { return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }; }

    try {
        const body = JSON.parse(event.body || '{}');
        const { message, state } = body; // 'state'를 추가로 받음.

        let response;

        // --- 3-1. 색상 추천 시나리오 분기 ---
        if (state?.step === 'start' && message === 'yes') {
            response = { reply: "메인 컬러의 헥사 코드를 알려주세요. (예: #0066CC)", state: { step: 'awaiting_hex' } };
        } else if (state?.step === 'awaiting_hex') {
            response = { ...analyzeContrast(message), state: { step: 'finished' } };
        } else if (state?.step === 'start' && message === 'no') {
            response = {
                reply: "좋아요. 어울리는 메인 컬러를 찾아 드릴게요. 먼저, 전체적인 **느낌**을 선택해주세요.",
                buttons: ['Soft (부드러운)', 'Hard (딱딱한)'],
                state: { step: 'awaiting_feel' }
            };
        } else if (state?.step === 'awaiting_feel') {
            const feel = message.toLowerCase().includes('soft') ? 'soft' : 'hard';
            response = {
                reply: `네, '${feel}' 느낌이군요. 이번엔 **분위기**를 골라주세요.`,
                buttons: ['Static (정적인)', 'Dynamic (동적인)'],
                state: { step: 'awaiting_mood', feel: feel }
            };
        } else if (state?.step === 'awaiting_mood') {
            const mood = message.toLowerCase().includes('static') ? 'static' : 'dynamic';
            const groupKey = `${state.feel}-${mood}`;
            const group = COLOR_SYSTEM[groupKey];
            response = {
                reply: `알겠습니다. '${group.title}' 스타일이네요. 마지막으로, 아래 키워드 중 가장 마음에 드는 **단어 하나**를 선택해주세요.`,
                buttons: Object.keys(group.keywords),
                state: { step: 'awaiting_keyword', groupKey: groupKey }
            };
        } else if (state?.step === 'awaiting_keyword') {
            const group = COLOR_SYSTEM[state.groupKey];
            const hexCode = group.keywords[message];
            response = {
                reply: `찾았습니다! '${message}' 느낌의 메인 컬러로 **${hexCode}** 를 추천해요. 이 색상으로 명도 대비 분석을 바로 진행할까요?`,
                buttons: ['네, 분석해주세요', '아니요, 괜찮아요'],
                state: { step: 'ask_analyze_after_recommend', hex: hexCode }
            };
        } else if (state?.step === 'ask_analyze_after_recommend' && message === '네, 분석해주세요') {
            response = { ...analyzeContrast(state.hex), state: { step: 'finished' } };
        } else {
            // --- 3-2. 기존 OpenAI 호출 로직 (일반 대화용) ---
            // (이 부분은 기존 코드와 거의 동일)
            // ...
            return { statusCode: 200, headers, body: JSON.stringify({ reply: '일반 대화 기능은 여기에 연결됩니다.' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify(response) };

    } catch (error) {
        // ... (기존 에러 처리)
        return { statusCode: 500, headers, body: JSON.stringify({ error: '오류 발생' }) };
    }
};