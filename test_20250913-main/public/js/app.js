// 전역 상태 관리
const AppState = {
    currentFile: null,
    analysisResults: null,
    chatHistory: [],
    isLoading: false
};

// DOM 요소 캐싱
const elements = {
    fileInput: document.getElementById('html-file'),
    analysisResults: document.getElementById('analysis-results'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    navLinks: document.querySelectorAll('.nav-link')
};

// 유틸리티 함수들
const utils = {
    // 안전한 HTML 생성
    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // 로딩 상태 표시
    showLoading: (element, text = '처리 중...') => {
        element.innerHTML = `<div class="loading" aria-live="polite">${text}</div>`;
    },

    // API 호출 헬퍼
    apiCall: async (endpoint, data, timeout = 8000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`/.netlify/functions/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
            }
            throw error;
        }
    },

    // 접근성 알림
    announceToScreenReader: (message) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
};

// HTML 파일 분석 모듈
const HTMLAnalyzer = {
    // 파일 업로드 처리
    async handleFileUpload(file) {
        if (!file || !file.type.includes('html')) {
            throw new Error('HTML 파일만 업로드 가능합니다.');
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
            throw new Error('파일 크기는 5MB 이하여야 합니다.');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            reader.readAsText(file);
        });
    },

    // HTML 분석 요청
    async analyzeHTML(htmlContent, filename) {
        try {
            const result = await utils.apiCall('analyze-html', {
                html: htmlContent,
                filename: filename
            });

            return result;
        } catch (error) {
            console.error('HTML 분석 오류:', error);
            throw new Error(error.message || '분석 중 오류가 발생했습니다.');
        }
    },

    // 분석 결과 렌더링
    renderResults(results) {
        const { critical, warnings, suggestions, summary } = results;
        
        let html = `
            <div class="result-section">
                <h3 class="result-title">
                    <span class="status-icon ${this.getStatusClass(summary.score)}" aria-hidden="true">${this.getStatusIcon(summary.score)}</span>
                    분석 결과 요약
                </h3>
                <p><strong>전체 점수:</strong> ${summary.score}/100점</p>
                <p><strong>접근성 등급:</strong> ${summary.grade}</p>
                <p><strong>주요 개선 포인트:</strong> ${summary.totalIssues}개 이슈 발견</p>
            </div>
        `;

        if (critical && critical.length > 0) {
            html += this.renderIssueSection('치명적 문제', critical, 'critical');
        }

        if (warnings && warnings.length > 0) {
            html += this.renderIssueSection('경고사항', warnings, 'warning');
        }

        if (suggestions && suggestions.length > 0) {
            html += this.renderIssueSection('개선 제안', suggestions, 'success');
        }

        elements.analysisResults.innerHTML = html;
        elements.analysisResults.classList.add('show');
        
        // 분석 완료 알림
        utils.announceToScreenReader(`분석이 완료되었습니다. ${summary.totalIssues}개의 이슈가 발견되었습니다.`);
        
        // 결과 영역으로 스크롤
        elements.analysisResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderIssueSection(title, issues, type) {
        const icon = {
            critical: '❌',
            warning: '⚠️', 
            success: '💡'
        }[type];

        let html = `
            <div class="result-section">
                <h3 class="result-title">
                    <span class="status-icon status-${type}" aria-hidden="true">${icon}</span>
                    ${title} (${issues.length}개)
                </h3>
                <ul class="issue-list" role="list">
        `;

        issues.forEach(issue => {
            html += `
                <li class="issue-item ${type}" role="listitem">
                    <strong>${utils.escapeHtml(issue.rule || issue.title)}:</strong>
                    <p>${utils.escapeHtml(issue.description || issue.message)}</p>
                    ${issue.element ? `<code>요소: ${utils.escapeHtml(issue.element)}</code>` : ''}
                    ${issue.lineNumber != 0 ? `<p><code>위치: ${issue.lineNumber}번 라인</code></p>` : ''}
                    ${issue.suggestion ? `<p><em>제안: ${utils.escapeHtml(issue.suggestion)}</em></p>` : ''}
                </li>
            `;
        });

        html += '</ul></div>';
        return html;
    },

    getStatusClass(score) {
        if (score >= 80) return 'status-success';
        if (score >= 60) return 'status-warning';
        return 'status-critical';
    },

    getStatusIcon(score) {
        if (score >= 80) return '✅';
        if (score >= 60) return '⚠️';
        return '❌';
    }
};

// AI 채팅 모듈
const AIChatBot = {
    // 메시지 전송
    async sendMessage(message) {
        if (!message.trim()) return;

        // 사용자 메시지 추가
        this.addMessage(message, 'user');
        
        // AI 응답 로딩 표시
        const loadingMessageElement = this.addMessage('응답을 생성하고 있습니다...', 'bot', true);
        
        try {
            const response = await utils.apiCall('ai-chatbot', {
                message: message,
                context: AppState.analysisResults || null,
                history: AppState.chatHistory.slice(-6) // 최근 6개 메시지만 전송
            });

            // 로딩 메시지 제거
            loadingMessageElement.remove();
            
            // AI 응답 추가
            this.addMessage(response.reply, 'bot');
            
            // 채팅 히스토리 업데이트
            AppState.chatHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.reply }
            );

        } catch (error) {
            console.error('AI 채팅 오류:', error);
            loadingMessageElement.remove();
            this.addMessage(
                '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n' +
                '오류 내용: ' + error.message, 
                'bot'
            );
        }
    },

    // 메시지 UI 추가
    addMessage(content, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isLoading) {
            messageContent.innerHTML = '<div class="loading">응답 생성 중...</div>';
        } else {
            // 마크다운 기본 지원 (줄바꿈, 강조)
            const formattedContent = utils.escapeHtml(content)
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            messageContent.innerHTML = `<p>${formattedContent}</p>`;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        elements.chatMessages.appendChild(messageDiv);
        
        // 스크롤을 맨 아래로
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        
        // 스크린 리더 알림
        if (!isLoading) {
            utils.announceToScreenReader(`${sender === 'user' ? '사용자' : 'AI'} 메시지: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
        }
        
        return messageDiv;
    }
};

// 네비게이션 관리
const Navigation = {
    init() {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });
    },

    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        
        // 활성 상태 업데이트
        elements.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        
        e.target.classList.add('active');
        e.target.setAttribute('aria-current', 'page');
        
        // 해당 섹션으로 스크롤
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // 포커스 관리
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus();
            setTimeout(() => {
                targetElement.removeAttribute('tabindex');
            }, 1000);
        }
    }
};

// 이벤트 리스너 설정
const EventListeners = {
    init() {
        // 파일 업로드
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', this.handleFileChange);
            
            // 드래그 앤 드롭 지원
            const uploadLabel = document.querySelector('.upload-label');
            if (uploadLabel) {
                uploadLabel.addEventListener('dragover', this.handleDragOver);
                uploadLabel.addEventListener('drop', this.handleDrop);
            }
        }

        // 채팅 폼
        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', this.handleChatSubmit);
        }

        // 채팅 입력 키보드 이벤트 (Shift+Enter로 전송)
        if (elements.chatInput) {
            elements.chatInput.addEventListener('keydown', this.handleChatInputKeydown);
        }

        // 전역 키보드 이벤트
        document.addEventListener('keydown', this.handleGlobalKeydown);
    },

    async handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        AppState.currentFile = file;
        
        try {
            utils.showLoading(elements.analysisResults, '파일을 분석하고 있습니다...');
            elements.analysisResults.classList.add('show');
            
            const htmlContent = await HTMLAnalyzer.handleFileUpload(file);
            const results = await HTMLAnalyzer.analyzeHTML(htmlContent, file.name);
            
            AppState.analysisResults = results;
            HTMLAnalyzer.renderResults(results);
            
        } catch (error) {
            console.error('파일 분석 오류:', error);
            elements.analysisResults.innerHTML = `
                <div class="result-section">
                    <h3 class="result-title">
                        <span class="status-icon status-critical" aria-hidden="true">❌</span>
                        분석 오류
                    </h3>
                    <p>파일 분석 중 오류가 발생했습니다: ${utils.escapeHtml(error.message)}</p>
                    <p>다시 시도하거나 다른 파일을 선택해주세요.</p>
                </div>
            `;
            elements.analysisResults.classList.add('show');
            utils.announceToScreenReader('파일 분석 중 오류가 발생했습니다.');
        }
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.style.borderColor = 'var(--color-primary)';
    },

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            elements.fileInput.files = files;
            elements.fileInput.dispatchEvent(new Event('change'));
        }
    },

    async handleChatSubmit(e) {
        e.preventDefault();
        
        const message = elements.chatInput.value.trim();
        if (!message || AppState.isLoading) return;
        
        AppState.isLoading = true;
        elements.chatInput.disabled = true;
        elements.chatForm.querySelector('.send-button').disabled = true;
        
        try {
            await AIChatBot.sendMessage(message);
            elements.chatInput.value = '';
            elements.chatInput.focus();
        } finally {
            AppState.isLoading = false;
            elements.chatInput.disabled = false;
            elements.chatForm.querySelector('.send-button').disabled = false;
        }
    },

    handleChatInputKeydown(e) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            elements.chatForm.dispatchEvent(new Event('submit'));
        }
    },

    handleGlobalKeydown(e) {
        // ESC 키로 모달이나 포커스 해제
        if (e.key === 'Escape') {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
    }
};

// 앱 초기화
const App = {
    init() {
        // DOM이 로드된 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },

    setup() {
        try {
            Navigation.init();
            EventListeners.init();
            
            console.log('접근성 디자인 어시스턴트가 초기화되었습니다.');
            
            // 초기 포커스 설정 (접근성)
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) {
                skipLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(skipLink.getAttribute('href'));
                    if (target) {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                    }
                });
            }
            
        } catch (error) {
            console.error('앱 초기화 중 오류:', error);
        }
    }
};

// 앱 시작
App.init();
