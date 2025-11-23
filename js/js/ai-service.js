/**
 * AI服务模块
 * 处理AI相关的功能：对话生成、小说生成、复习题生成等
 */

class AIService {
    constructor() {
        this.apiKey = ''; // 用户可配置的API密钥
        this.baseUrl = 'https://api.moonshot.cn/v1'; // Kimi API基础地址
        this.isConfigured = false;
    }

    /**
     * 配置API密钥
     */
    configure(apiKey) {
        this.apiKey = apiKey;
        this.isConfigured = true;
        localStorage.setItem('ai_api_key', apiKey);
    }

    /**
     * 检查是否已配置
     */
    checkConfiguration() {
        const storedKey = localStorage.getItem('ai_api_key');
        if (storedKey) {
            this.apiKey = storedKey;
            this.isConfigured = true;
            return true;
        }
        return false;
    }

    /**
     * 模拟AI响应（当未配置API时使用）
     */
    simulateAIResponse(prompt, type = 'general') {
        const responses = {
            greeting: [
                "你好！很高兴见到你！今天想学什么呢？",
                "欢迎回来！让我们开始愉快的英语学习吧！",
                "嗨！准备好提升你的英语水平了吗？"
            ],
            encouragement: [
                "太棒了！你学得很快！",
                "很好！继续保持这个学习节奏！",
                "优秀！你的进步很明显！",
                "做得好！继续努力！"
            ],
            correction: [
                "Almost there! 让我们一起看看正确的说法...",
                "Good try! 试试这个表达...",
                "Nice effort! 正确的说法是..."
            ],
            general: [
                "这个想法很有趣！让我们深入讨论一下。",
                "很好的观点！我同意你的看法。",
                "让我来帮你更好地理解这个概念。"
            ]
        };

        const categoryResponses = responses[type] || responses.general;
        const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
        
        // 模拟API延迟
        return new Promise(resolve => {
            setTimeout(() => resolve(randomResponse), 1000 + Math.random() * 2000);
        });
    }

    /**
     * 调用真实API（如果已配置）
     */
    async callAPI(messages, model = 'moonshot-v1-8k') {
        if (!this.isConfigured) {
            throw new Error('API未配置');
        }

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('API调用失败:', error);
            throw error;
        }
    }

    /**
     * 生成AI对话
     */
    async generateConversation(learnedWords = []) {
        const systemPrompt = `你是一名友善的英语学习助手。用户正在学习英语，请用简单易懂的方式与用户对话。
        如果用户已学习一些单词，请在对话中自然地使用这些单词来帮助他们复习。
        保持对话简短友好，每次回复控制在2-3句话内。`;

        const userPrompt = learnedWords.length > 0 
            ? `用户已学习的单词: ${learnedWords.join(', ')}。请主动发起一段对话，并尽量使用这些单词。`
            : `请主动发起一段简单的英语学习对话。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            if (this.isConfigured) {
                return await this.callAPI(messages);
            } else {
                return await this.simulateAIResponse(userPrompt, 'greeting');
            }
        } catch (error) {
            console.error('对话生成失败:', error);
            return await this.simulateAIResponse(userPrompt, 'general');
        }
    }

    /**
     * 生成AI对话响应
     */
    async generateResponse(userMessage, learnedWords = []) {
        const systemPrompt = `你是一名英语学习助手。请根据用户的消息给出合适的回复。
        如果可能的话，在回复中使用一些用户已学的单词来帮助复习。
        保持回复简短友好，1-2句话即可。
        
        用户已学单词: ${learnedWords.join(', ')}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];

        try {
            if (this.isConfigured) {
                return await this.callAPI(messages);
            } else {
                // 根据用户消息类型返回模拟响应
                const responses = this.getSimulatedResponse(userMessage);
                return responses[Math.floor(Math.random() * responses.length)];
            }
        } catch (error) {
            console.error('响应生成失败:', error);
            return "让我想想... 这是一个很好的问题！";
        }
    }

    /**
     * 获取模拟响应
     */
    getSimulatedResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return ["Hello! Nice to meet you!", "Hi there! How are you today?", "Hello! Great to see you!"];
        }
        
        if (lowerMessage.includes('thank') || lowerMessage.includes('谢谢')) {
            return ["You're welcome!", "My pleasure!", "Glad I could help!"];
        }
        
        if (lowerMessage.includes('how are you')) {
            return ["I'm doing great, thanks for asking!", "I'm fine, thank you!", "Everything is wonderful!"];
        }
        
        if (lowerMessage.includes('what') || lowerMessage.includes('什么')) {
            return ["That's a very interesting question!", "Let me think about that...", "Great question! Here's what I think..."];
        }
        
        return ["I understand what you mean.", "That's a good point!", "Let's continue learning together!"];
    }

    /**
     * 生成AI小说
     */
    async generateNovel(words, style = 'casual') {
        const stylePrompts = {
            casual: "轻松日常的生活场景",
            adventure: "充满冒险和探索的故事",
            business: "商务工作环境中的故事",
            academic: "学术讨论和研究场景"
        };

        const systemPrompt = `你是一名英语教育专家。请根据提供的单词列表创作一段200字左右的趣味短文。
        要求：
        1. 必须包含所有提供的单词（用英文原文）
        2. 情节连贯有故事性，适合英语学习者阅读
        3. 人物对话自然，使用日常口语表达
        4. 难度适中，符合CEFR B1-B2水平
        5. 风格：${stylePrompts[style]}
        
        单词列表：${words.join(', ')}
        
        请用英文创作，并在重点单词后用括号标注中文释义。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请生成小说内容' }
        ];

        try {
            if (this.isConfigured) {
                const novel = await this.callAPI(messages, 'moonshot-v1-8k');
                return this.processNovelText(novel, words);
            } else {
                return await this.generateSimulatedNovel(words, style);
            }
        } catch (error) {
            console.error('小说生成失败:', error);
            return await this.generateSimulatedNovel(words, style);
        }
    }

    /**
     * 处理小说文本，高亮重点单词
     */
    processNovelText(text, words) {
        let processedText = text;
        
        words.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            processedText = processedText.replace(regex, `<span class="highlighted-word" data-word="${word}">${word}</span>`);
        });
        
        return processedText;
    }

    /**
     * 生成模拟小说
     */
    async generateSimulatedNovel(words, style) {
        const templates = {
            casual: [
                `Today was such a ${words[0] || 'interesting'} day! I woke up early and decided to ${words[1] || 'explore'} the city. While walking, I met a ${words[2] || 'friendly'} person who offered to help me with my ${words[3] || 'daily'} tasks. We ${words[4] || 'talked'} about many things and I learned something ${words[5] || 'new'} about ${words[6] || 'life'}. This ${words[7] || 'experience'} made me realize how ${words[8] || 'important'} it is to ${words[9] || 'connect'} with others. What a ${words[10] || 'wonderful'} day!`,
                
                `Last weekend, I decided to ${words[0] || 'organize'} my ${words[1] || 'schedule'} and ${words[2] || 'plan'} some ${words[3] || 'activities'}. I wanted to ${words[4] || 'improve'} my ${words[5] || 'skills'} in different areas. During this ${words[6] || 'process'}, I discovered that ${words[7] || 'practice'} makes perfect. My ${words[8] || 'progress'} was slow but ${words[9] || 'steady'}. I'm looking forward to the ${words[10] || 'future'}!`
            ],
            adventure: [
                `The ${words[0] || 'mysterious'} ${words[1] || 'adventure'} began when I found an old ${words[2] || 'map'} in the ${words[3] || 'attic'}. It showed a ${words[4] || 'hidden'} treasure ${words[5] || 'location'} that ${words[6] || 'excited'} me greatly. I ${words[7] || 'decided'} to ${words[8] || 'explore'} this ${words[9] || 'mysterious'} place. The ${words[10] || 'journey'} was ${words[11] || 'challenging'}, but I finally ${words[12] || 'discovered'} something ${words[13] || 'incredible'}!`,
                
                `Deep in the ${words[0] || 'forest'}, I ${words[1] || 'encountered'} a ${words[2] || 'strange'} ${words[3] || 'creature'} that seemed ${words[4] || 'friendly'}. It ${words[5] || 'guided'} me to a ${words[6] || 'secret'} ${words[7] || 'cave'} where ancient ${words[8] || 'treasures'} were ${words[9] || 'hidden'}. This ${words[10] || 'unforgettable'} ${words[11] || 'experience'} changed my ${words[12] || 'perspective'} on ${words[13] || 'adventure'}.`
            ]
        };

        const styleTemplates = templates[style] || templates.casual;
        const selectedTemplate = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];
        
        return new Promise(resolve => {
            setTimeout(() => {
                const processedText = this.processNovelText(selectedTemplate, words);
                resolve(processedText);
            }, 2000);
        });
    }

    /**
     * 生成复习题目
     */
    async generateQuizQuestion(word) {
        const systemPrompt = `为单词"${word.word}"生成3个干扰选项，用于英语测试题。
        要求：
        - 选项为中文释义
        - 1个正确答案
        - 3个干扰项需与正确答案在词义、词性或拼写上相似，具有迷惑性
        - 返回JSON格式：{"correct":"正确释义","distractors":["干扰1","干扰2","干扰3"]}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请生成题目选项' }
        ];

        try {
            if (this.isConfigured) {
                const response = await this.callAPI(messages);
                return JSON.parse(response);
            } else {
                return await this.generateSimulatedQuiz(word);
            }
        } catch (error) {
            console.error('题目生成失败:', error);
            return await this.generateSimulatedQuiz(word);
        }
    }

    /**
     * 生成模拟题目
     */
    async generateSimulatedQuiz(word) {
        const simulatedQuizzes = {
            'apple': {
                correct: '苹果',
                distractors: ['应用软件', '应用程序', '香蕉']
            },
            'book': {
                correct: '书',
                distractors: ['书店', '图书馆', '课本']
            },
            'water': {
                correct: '水',
                distractors: ['雨水', '河水', '湖水']
            },
            'computer': {
                correct: '计算机',
                distractors: ['计算器', '程序', '软件']
            },
            'beautiful': {
                correct: '美丽的',
                distractors: ['漂亮的', '英俊的', '可爱的']
            }
        };

        // 如果有预定义的题目，返回它
        if (simulatedQuizzes[word.word.toLowerCase()]) {
            return simulatedQuizzes[word.word.toLowerCase()];
        }

        // 生成随机干扰项
        const commonWords = ['好的', '坏的', '大的', '小的', '新的', '旧的', '快的', '慢的', '热的', '冷的'];
        const distractors = [];
        
        while (distractors.length < 3) {
            const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)];
            if (!distractors.includes(randomWord) && randomWord !== word.meaning) {
                distractors.push(randomWord);
            }
        }

        return {
            correct: word.meaning,
            distractors: distractors
        };
    }

    /**
     * 获取单词详情
     */
    async getWordDetails(word) {
        const systemPrompt = `请提供单词"${word}"的详细信息，包括：
        1. 详细释义
        2. 词性
        3. 常用短语
        4. 同义词
        5. 反义词
        6. 例句
        请用中文回答。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请提供单词详情' }
        ];

        try {
            if (this.isConfigured) {
                return await this.callAPI(messages);
            } else {
                return `单词"${word}"的详细信息：
                
释义：具体的含义说明
词性：名词/动词/形容词等
常用短语：相关短语搭配
同义词：意思相近的词
反义词：意思相反的词
例句：使用示例`;
            }
        } catch (error) {
            console.error('单词详情获取失败:', error);
            return `暂时无法获取"${word}"的详细信息，请稍后再试。`;
        }
    }
}

// 导出AI服务实例
window.aiService = new AIService();