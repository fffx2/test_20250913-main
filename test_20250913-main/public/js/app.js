/* [파일: app.js] */
/* 역할: 사용자 인터페이스의 모든 상호작용과 동적 기능을 처리하는 클라이언트 사이드 JavaScript. */

// --- 1. 전역 상태 및 DOM 요소 관리 (수정) ---

const AppState = {
    currentFile: null,
    analysisResults: null,
    chatHistory: [],
    isLoading: false,
    chatState: { step: 'start' } // 챗봇의 대화 상태를 추적하는 객체 추가.
};

const elements = {
    // ...(기존 요소들)
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    sendButton: document.querySelector('.send-button'), // 전송 버튼 캐싱.
    // 버튼이 추가될 컨테이너를 chat-form 안에 만듭니다. (HTML 수정 필요 없음)
};

// --- 2. AI 채팅 모듈 (대폭 수정) ---

const AIChatBot = {
    // 초기 질문을 받아오기 위한 함수.
    startConversation() {
        this.sendMessage(null, AppState.chatState); // 시작할 때 빈 메시지와 초기 상태 전송.
    },
    
    // 메시지 전송 로직 수정.
    async sendMessage(message, state) {
        // 사용자가 직접 입력한 메시지만 히스토리에 추가.
        if (message) {
            this.addMessage(message, 'user');
        }
        
        // 로딩 상태 UI 업데이트.
        this.setLoading(true);
        const loadingMessageElement = this.addMessage('응답을 생성하고 있습니다...', 'bot', true);

        try {
            const response = await utils.apiCall('ai-chatbot', {
                message: message,
                state: state, // 현재 대화 상태를 함께 전송.
                context: AppState.analysisResults || null,
                history: AppState.chatHistory.slice(-6)
            });

            loadingMessageElement.remove();
            
            // 응답에서 받은 새로운 상태로 업데이트.
            AppState.chatState = response.state || { step: 'finished' };
            
            // AI 응답 메시지와 버튼을 화면에 그림.
            this.addMessage(response.reply, 'bot', false, response.buttons);
            
            // 대화 히스토리 업데이트.
            if (message) { // 사용자가 보낸 메시지가 있을 때만 히스토리 기록.
                AppState.chatHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: response.reply }
                );
            }

        } catch (error) {
            // ... (기존 에러 처리)
            loadingMessageElement.remove();
            this.addMessage('죄송합니다. 오류가 발생했습니다: ' + error.message, 'bot');
        } finally {
            this.setLoading(false);
        }
    },

    // 메시지 UI 추가 로직 수정 (버튼 렌더링 기능 추가).
    addMessage(content, sender, isLoading = false, buttons = []) {
        const messageDiv = document.createElement('div');
        // ... (기존 메시지 div 생성 로직은 동일)
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isLoading) {
            messageContent.innerHTML = '<div class="loading">응답 생성 중...</div>';
        } else {
            // 마크다운 기본 지원
            const formattedContent = utils.escapeHtml(content).replace(/\n/g, '<br>');
            messageContent.innerHTML = `<p>${formattedContent}</p>`;
        }
        
        // ... (기존 메시지 조립 로직은 동일)
        elements.chatMessages.appendChild(messageDiv);
        
        // *** 새로운 기능: 버튼 렌더링 ***
        if (buttons && buttons.length > 0) {
            this.renderButtons(buttons);
        }

        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        return messageDiv;
    },

    // 버튼을 만들고 이벤트 리스너를 추가하는 새 함수.
    renderButtons(buttonLabels) {
        // 기존 버튼이 있다면 모두 삭제.
        const existingButtons = document.querySelector('.chat-buttons');
        if (existingButtons) existingButtons.remove();

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'chat-buttons'; // (CSS로 스타일 추가 필요)

        buttonLabels.forEach(label => {
            const button = document.createElement('button');
            button.textContent = label;
            button.className = 'chat-button'; // (CSS로 스타일 추가 필요)
            button.onclick = () => {
                this.handleButtonClick(label);
                // 버튼 클릭 후 모든 버튼 비활성화.
                buttonContainer.querySelectorAll('.chat-button').forEach(btn => btn.disabled = true);
            };
            buttonContainer.appendChild(button);
        });

        elements.chatMessages.appendChild(buttonContainer);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    },

    // 버튼 클릭 처리 함수.
    handleButtonClick(label) {
        this.sendMessage(label, AppState.chatState);
    },

    // 로딩 상태 관리 함수.
    setLoading(isLoading) {
        AppState.isLoading = isLoading;
        elements.chatInput.disabled = isLoading;
        elements.sendButton.disabled = isLoading;
    }
};

// --- 3. 이벤트 리스너 설정 (수정) ---

const EventListeners = {
    init() {
        // ... (파일 업로드 리스너는 동일)

        // 채팅 폼 제출 이벤트 (사용자가 직접 타이핑했을 때).
        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', this.handleChatSubmit);
        }
    },

    // ... (파일 관련 핸들러는 동일)

    // 채팅 폼 제출 핸들러 수정.
    async handleChatSubmit(e) {
        e.preventDefault();
        
        const message = elements.chatInput.value.trim();
        if (!message || AppState.isLoading) return;
        
        // 텍스트 입력 시에는 현재 대화 상태를 그대로 사용.
        await AIChatBot.sendMessage(message, AppState.chatState);
        elements.chatInput.value = '';
        elements.chatInput.focus();
    },

    // ...
};

// --- 4. 애플리케이션 초기화 (수정) ---

const App = {
    init() {
        document.addEventListener('DOMContentLoaded', () => this.setup());
    },
    
    setup() {
        EventListeners.init();
        Navigation.init(); 
        
        // *** 앱 시작 시, 일반 인사 대신 첫 시나리오 질문을 받아옴 ***
        AIChatBot.startConversation();
    }
};

// 앱 실행.
App.init();