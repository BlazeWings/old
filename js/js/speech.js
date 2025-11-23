/**
 * 语音合成模块
 * 使用Web Speech API实现单词和句子朗读
 */

class SpeechService {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentVoice = null;
        this.voiceSettings = {
            rate: 1.0,      // 语速 0.1-2.0
            pitch: 1.0,     // 音调 0-2
            volume: 1.0,    // 音量 0-1
            lang: 'en-US'   // 语言
        };
        this.isInitialized = false;
        this.isSupported = 'speechSynthesis' in window;
    }

    /**
     * 初始化语音服务
     */
    async init() {
        if (!this.isSupported) {
            console.warn('浏览器不支持语音合成功能');
            return false;
        }

        // 等待语音列表加载
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
                if (this.voices.length > 0) {
                    this.selectBestVoice();
                    this.isInitialized = true;
                    resolve(true);
                } else {
                    // 某些浏览器需要延迟加载
                    setTimeout(loadVoices, 100);
                }
            };

            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = loadVoices;
            }
            
            loadVoices();
        });
    }

    /**
     * 选择最佳语音
     */
    selectBestVoice() {
        // 优先选择美式英语，然后是英式英语
        const preferredVoices = [
            { lang: 'en-US', name: 'Google US English' },
            { lang: 'en-US', name: 'Microsoft Aria Online (Natural) - English (United States)' },
            { lang: 'en-US', name: 'Alex' }, // macOS
            { lang: 'en-GB', name: 'Google UK English Female' },
            { lang: 'en-GB', name: 'Google UK English Male' },
            { lang: 'en-GB', name: 'Microsoft Zira Desktop - English (Great Britain)' }
        ];

        // 查找首选语音
        for (const preferred of preferredVoices) {
            const voice = this.voices.find(v => 
                v.lang === preferred.lang && v.name.includes(preferred.name.split(' ')[0])
            );
            if (voice) {
                this.currentVoice = voice;
                this.voiceSettings.lang = voice.lang;
                return;
            }
        }

        // 如果没找到首选语音，选择任何英语语音
        const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            this.currentVoice = englishVoice;
            this.voiceSettings.lang = englishVoice.lang;
        }
    }

    /**
     * 朗读文本
     * @param {string} text - 要朗读的文本
     * @param {Object} options - 朗读选项
     */
    speak(text, options = {}) {
        if (!this.isInitialized || !this.isSupported) {
            console.warn('语音服务未初始化或不支持');
            return;
        }

        // 取消当前播放
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语音参数
        utterance.voice = this.currentVoice;
        utterance.rate = options.rate || this.voiceSettings.rate;
        utterance.pitch = options.pitch || this.voiceSettings.pitch;
        utterance.volume = options.volume || this.voiceSettings.volume;
        utterance.lang = options.lang || this.voiceSettings.lang;

        // 设置事件监听器
        utterance.onstart = () => {
            console.log('开始朗读:', text);
            this.onSpeechStart && this.onSpeechStart(text);
        };

        utterance.onend = () => {
            console.log('朗读结束:', text);
            this.onSpeechEnd && this.onSpeechEnd(text);
        };

        utterance.onerror = (event) => {
            console.error('朗读错误:', event.error);
            this.onSpeechError && this.onSpeechError(event.error);
        };

        utterance.onpause = () => {
            this.onSpeechPause && this.onSpeechPause();
        };

        utterance.onresume = () => {
            this.onSpeechResume && this.onSpeechResume();
        };

        // 开始朗读
        this.synthesis.speak(utterance);
        this.currentUtterance = utterance;
    }

    /**
     * 朗读单词
     * @param {string} word - 单词
     * @param {string} type - 朗读类型：'word', 'meaning', 'example'
     */
    speakWord(word, type = 'word') {
        if (!word) return;

        let text = word;
        let options = {};

        switch (type) {
            case 'word':
                text = word;
                options = { rate: 0.8 }; // 单词读慢一点
                break;
            case 'meaning':
                text = word;
                options = { rate: 1.0 };
                break;
            case 'example':
                text = word;
                options = { rate: 0.9 }; // 例句稍慢
                break;
        }

        this.speak(text, options);
    }

    /**
     * 朗读句子
     * @param {string} sentence - 句子
     * @param {Object} options - 选项
     */
    speakSentence(sentence, options = {}) {
        if (!sentence) return;

        const defaultOptions = {
            rate: 0.9,
            pitch: 1.0,
            volume: 0.8
        };

        this.speak(sentence, { ...defaultOptions, ...options });
    }

    /**
     * 停止朗读
     */
    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }

    /**
     * 暂停朗读
     */
    pause() {
        if (this.synthesis.speaking && !this.synthesis.paused) {
            this.synthesis.pause();
        }
    }

    /**
     * 恢复朗读
     */
    resume() {
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    /**
     * 检查是否正在朗读
     */
    isSpeaking() {
        return this.synthesis.speaking;
    }

    /**
     * 检查是否暂停
     */
    isPaused() {
        return this.synthesis.paused;
    }

    /**
     * 获取可用语音列表
     */
    getAvailableVoices() {
        return this.voices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            local: voice.localService,
            voiceURI: voice.voiceURI
        }));
    }

    /**
     * 设置语音
     * @param {string} voiceURI - 语音标识符
     */
    setVoice(voiceURI) {
        const voice = this.voices.find(v => v.voiceURI === voiceURI);
        if (voice) {
            this.currentVoice = voice;
            this.voiceSettings.lang = voice.lang;
            return true;
        }
        return false;
    }

    /**
     * 设置语音参数
     * @param {Object} settings - 语音设置
     */
    updateSettings(settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
        
        // 保存到本地存储
        localStorage.setItem('speech_settings', JSON.stringify(this.voiceSettings));
    }

    /**
     * 获取语音设置
     */
    getSettings() {
        return { ...this.voiceSettings };
    }

    /**
     * 加载保存的设置
     */
    loadSettings() {
        const saved = localStorage.getItem('speech_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.voiceSettings = { ...this.voiceSettings, ...settings };
            } catch (error) {
                console.error('加载语音设置失败:', error);
            }
        }
    }

    /**
     * 生成语音控制UI
     * @param {HTMLElement} container - 容器元素
     */
    createVoiceControls(container) {
        if (!container) return;

        const controlsHTML = `
            <div class="voice-controls">
                <div class="voice-settings">
                    <label>
                        语速: 
                        <input type="range" id="voiceRate" min="0.5" max="2.0" step="0.1" 
                               value="${this.voiceSettings.rate}">
                        <span id="rateValue">${this.voiceSettings.rate}</span>
                    </label>
                    
                    <label>
                        音量: 
                        <input type="range" id="voiceVolume" min="0.1" max="1.0" step="0.1" 
                               value="${this.voiceSettings.volume}">
                        <span id="volumeValue">${this.voiceSettings.volume}</span>
                    </label>
                    
                    <label>
                        语音: 
                        <select id="voiceSelect">
                            ${this.getAvailableVoices().map(voice => 
                                `<option value="${voice.voiceURI}" 
                                        ${this.currentVoice?.voiceURI === voice.voiceURI ? 'selected' : ''}>
                                    ${voice.name} (${voice.lang})
                                </option>`
                            ).join('')}
                        </select>
                    </label>
                </div>
            </div>
        `;

        container.innerHTML = controlsHTML;

        // 添加事件监听器
        const rateSlider = container.querySelector('#voiceRate');
        const volumeSlider = container.querySelector('#voiceVolume');
        const voiceSelect = container.querySelector('#voiceSelect');
        const rateValue = container.querySelector('#rateValue');
        const volumeValue = container.querySelector('#volumeValue');

        rateSlider.addEventListener('input', (e) => {
            const rate = parseFloat(e.target.value);
            rateValue.textContent = rate;
            this.updateSettings({ rate });
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            volumeValue.textContent = volume;
            this.updateSettings({ volume });
        });

        voiceSelect.addEventListener('change', (e) => {
            this.setVoice(e.target.value);
        });
    }

    /**
     * 获取支持的语音
     */
    getSupportedLanguages() {
        const languages = new Set();
        this.voices.forEach(voice => {
            languages.add(voice.lang.split('-')[0]); // 获取语言代码（如 'en', 'zh'）
        });
        return Array.from(languages);
    }

    /**
     * 获取英语语音
     */
    getEnglishVoices() {
        return this.voices.filter(voice => voice.lang.startsWith('en'));
    }

    /**
     * 测试语音
     */
    testVoice() {
        const testText = "Hello, this is a voice test. How does it sound?";
        this.speak(testText);
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stop();
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onSpeechError = null;
        this.onSpeechPause = null;
        this.onSpeechResume = null;
    }
}

// 导出语音服务实例
window.speechService = new SpeechService();