/**
 * 主应用逻辑
 * 整合所有模块，控制整个学习流程
 */

class EnglishLearningApp {
    constructor() {
        this.currentPage = 'learning';
        this.currentWordIndex = 0;
        this.currentWords = [];
        this.learnedWords = [];
        this.userSettings = {
            dailyGoal: 20,
            preferredCategory: 'all',
            theme: 'light',
            voiceSettings: {}
        };
        
        // DOM元素引用
        this.elements = {};
        
        // 初始化
        this.init();
    }

    /**
     * 应用初始化
     */
    async init() {
        try {
            // 初始化数据库
            await database.init();
            
            // 初始化语音服务
            await speechService.init();
            speechService.loadSettings();
            
            // 加载用户设置
            await this.loadUserSettings();
            
            // 设置DOM引用
            this.setupDOMElements();
            
            // 绑定事件
            this.bindEvents();
            
            // 初始化主题
            this.initTheme();
            
            // 加载初始数据
            await this.loadInitialData();
            
            // 初始化图表
            this.initCharts();
            
            // 隐藏加载界面
            this.hideLoading();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 设置DOM元素引用
     */
    setupDOMElements() {
        // 导航元素
        this.elements.navItems = document.querySelectorAll('.nav-item');
        this.elements.pages = document.querySelectorAll('.page');
        this.elements.themeToggle = document.getElementById('themeToggle');
        
        // 分组学习页面
        this.elements.categoryBtns = document.querySelectorAll('.category-btn');
        this.elements.progressDots = document.getElementById('progressDots');
        this.elements.wordCard = document.getElementById('wordCard');
        this.elements.wordText = document.getElementById('wordText');
        this.elements.phonetic = document.getElementById('phonetic');
        this.elements.wordMeaning = document.getElementById('wordMeaning');
        this.elements.wordExample = document.getElementById('wordExample');
        this.elements.difficultyBadge = document.getElementById('difficultyBadge');
        this.elements.audioBtn = document.getElementById('audioBtn');
        this.elements.knowBtn = document.getElementById('knowBtn');
        this.elements.dontKnowBtn = document.getElementById('dontKnowBtn');
        this.elements.nextGroupBtn = document.getElementById('nextGroupBtn');
        this.elements.prevWordBtn = document.getElementById('prevWordBtn');
        this.elements.currentGroup = document.getElementById('currentGroup');
        this.elements.totalGroups = document.getElementById('totalGroups');
        
        // AI辅助页面
        this.elements.tabBtns = document.querySelectorAll('.tab-btn');
        this.elements.tabContents = document.querySelectorAll('.tab-content');
        this.elements.chatMessages = document.getElementById('chatMessages');
        this.elements.chatInput = document.getElementById('chatInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
        this.elements.generateNovelBtn = document.getElementById('generateNovelBtn');
        this.elements.novelContent = document.getElementById('novelContent');
        this.elements.novelStyle = document.getElementById('novelStyle');
        
        // 单词库页面
        this.elements.wordSearch = document.getElementById('wordSearch');
        this.elements.categoryFilter = document.getElementById('categoryFilter');
        this.elements.difficultyFilter = document.getElementById('difficultyFilter');
        this.elements.importBtn = document.getElementById('importBtn');
        this.elements.csvInput = document.getElementById('csvInput');
        this.elements.wordBankGrid = document.getElementById('wordBankGrid');
        this.elements.totalWords = document.getElementById('totalWords');
        this.elements.masteredWords = document.getElementById('masteredWords');
        this.elements.learningWords = document.getElementById('learningWords');
        
        // 复习页面
        this.elements.reviewQueueCount = document.getElementById('reviewQueueCount');
        this.elements.todayCompleted = document.getElementById('todayCompleted');
        this.elements.reviewStreak = document.getElementById('reviewStreak');
        this.elements.startReviewBtn = document.getElementById('startReviewBtn');
        this.elements.quickReviewBtn = document.getElementById('quickReviewBtn');
        this.elements.quizContainer = document.getElementById('quizContainer');
        this.elements.wordToReview = document.getElementById('wordToReview');
        this.elements.quizOptions = document.getElementById('quizOptions');
        this.elements.quizFeedback = document.getElementById('quizFeedback');
        
        // 进度页面
        this.elements.totalVocab = document.getElementById('totalVocab');
        this.elements.todayLearning = document.getElementById('todayLearning');
        this.elements.pendingReview = document.getElementById('pendingReview');
        this.elements.learningStreak = document.getElementById('learningStreak');
        this.elements.dailyProgress = document.getElementById('dailyProgress');
        this.elements.progressText = document.getElementById('progressText');
        this.elements.dailyGoal = document.getElementById('dailyGoal');
        this.elements.reviewReminder = document.getElementById('reviewReminder');
        this.elements.voiceSettings = document.getElementById('voiceSettings');
        
        // 其他元素
        this.elements.loadingOverlay = document.getElementById('loadingOverlay');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航事件
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.currentTarget.dataset.page);
            });
        });

        // 主题切换
        this.elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 分类选择
        this.elements.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.currentTarget.dataset.category);
            });
        });

        // 音频按钮
        this.elements.audioBtn.addEventListener('click', () => {
            this.playWordAudio();
        });

        // 学习按钮
        this.elements.knowBtn.addEventListener('click', () => {
            this.handleWordResponse('know');
        });

        this.elements.dontKnowBtn.addEventListener('click', () => {
            this.handleWordResponse('dontKnow');
        });

        // 导航按钮
        this.elements.nextGroupBtn.addEventListener('click', () => {
            this.nextGroup();
        });

        this.elements.prevWordBtn.addEventListener('click', () => {
            this.previousWord();
        });

        // AI标签切换
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // AI对话
        this.elements.sendBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });

        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // AI小说生成
        this.elements.generateNovelBtn.addEventListener('click', () => {
            this.generateNovel();
        });

        // 单词库搜索和过滤
        this.elements.wordSearch.addEventListener('input', () => {
            this.filterWordBank();
        });

        this.elements.categoryFilter.addEventListener('change', () => {
            this.filterWordBank();
        });

        this.elements.difficultyFilter.addEventListener('change', () => {
            this.filterWordBank();
        });

        // 导入功能
        this.elements.importBtn.addEventListener('click', () => {
            this.elements.csvInput.click();
        });

        this.elements.csvInput.addEventListener('change', (e) => {
            this.importCSV(e.target.files[0]);
        });

        // 复习功能
        this.elements.startReviewBtn.addEventListener('click', () => {
            this.startReview();
        });

        this.elements.quickReviewBtn.addEventListener('click', () => {
            this.startQuickReview();
        });

        // 进度设置
        this.elements.dailyGoal.addEventListener('change', () => {
            this.updateDailyGoal();
        });

        // 语音设置
        if (this.elements.voiceSettings) {
            this.elements.voiceSettings.addEventListener('change', () => {
                this.updateVoiceSettings();
            });
        }
    }

    /**
     * 页面切换
     */
    async switchPage(pageName) {
        // 更新导航状态
        this.elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        // 切换页面
        this.elements.pages.forEach(page => {
            page.classList.toggle('active', page.id === `${pageName}-page`);
        });

        this.currentPage = pageName;

        // 页面特定加载
        switch (pageName) {
            case 'learning':
                await this.loadLearningPage();
                break;
            case 'word-bank':
                await this.loadWordBankPage();
                break;
            case 'review':
                await this.loadReviewPage();
                break;
            case 'progress':
                await this.loadProgressPage();
                break;
            case 'ai-assistant':
                await this.loadAIAssistantPage();
                break;
        }
    }

    /**
     * 加载学习页面
     */
    async loadLearningPage() {
        if (this.currentWords.length === 0) {
            await this.loadNewWords();
        }
        this.displayCurrentWord();
        this.updateProgress();
    }

    /**
     * 加载新单词组
     */
    async loadNewWords() {
        try {
            const words = await database.getWords({ 
                category: this.userSettings.preferredCategory === 'all' ? null : this.userSettings.preferredCategory 
            });
            
            // 过滤未学习的单词
            const unlearnedWords = words.filter(word => word.reviewCount === 0);
            
            if (unlearnedWords.length >= 10) {
                // 随机选择10个单词
                this.currentWords = this.shuffleArray([...unlearnedWords]).slice(0, 10);
            } else {
                // 如果未学习单词不足10个，从所有单词中选择
                this.currentWords = this.shuffleArray([...words]).slice(0, 10);
            }
            
            this.currentWordIndex = 0;
            this.updateGroupInfo();
        } catch (error) {
            console.error('加载单词失败:', error);
            this.showError('加载单词失败');
        }
    }

    /**
     * 显示当前单词
     */
    displayCurrentWord() {
        if (this.currentWordIndex >= this.currentWords.length) {
            this.showGroupComplete();
            return;
        }

        const word = this.currentWords[this.currentWordIndex];
        
        this.elements.wordText.textContent = word.word;
        this.elements.phonetic.textContent = word.phonetic || '';
        this.elements.wordMeaning.textContent = word.meaning;
        this.elements.wordExample.textContent = word.example || '';
        
        // 设置难度标签
        const difficultyMap = {
            easy: { text: '简单', class: 'easy' },
            medium: { text: '中等', class: 'medium' },
            hard: { text: '困难', class: 'hard' }
        };
        
        const difficulty = difficultyMap[word.difficulty] || difficultyMap.medium;
        this.elements.difficultyBadge.textContent = difficulty.text;
        this.elements.difficultyBadge.className = `difficulty-badge ${difficulty.class}`;
        
        // 更新按钮状态
        this.elements.knowBtn.disabled = false;
        this.elements.dontKnowBtn.disabled = false;
        this.elements.prevWordBtn.disabled = this.currentWordIndex === 0;
    }

    /**
     * 处理单词学习响应
     */
    async handleWordResponse(response) {
        const word = this.currentWords[this.currentWordIndex];
        
        // 禁用按钮防止重复点击
        this.elements.knowBtn.disabled = true;
        this.elements.dontKnowBtn.disabled = true;

        try {
            const isKnown = response === 'know';
            
            // 更新数据库
            if (isKnown) {
                const updatedWord = srsAlgorithm.calculateNextReview(word, 'good');
                updatedWord.isLearned = true;
                await database.updateWord(word.id, updatedWord);
                await database.addLearningRecord({
                    wordId: word.id,
                    action: 'learn',
                    difficulty: word.difficulty
                });
                
                // 添加到已学单词列表
                if (!this.learnedWords.includes(word.word)) {
                    this.learnedWords.push(word.word);
                }
            } else {
                const updatedWord = srsAlgorithm.calculateNextReview(word, 'again');
                await database.updateWord(word.id, updatedWord);
            }

            // 更新统计
            this.updateDailyProgress();
            
            // 移动到下一个单词
            this.currentWordIndex++;
            this.displayCurrentWord();
            this.updateProgress();

        } catch (error) {
            console.error('处理单词响应失败:', error);
            this.showError('保存学习记录失败');
        }
    }

    /**
     * 播放单词音频
     */
    playWordAudio() {
        const word = this.currentWords[this.currentWordIndex];
        if (word) {
            speechService.speakWord(word.word, 'word');
        }
    }

    /**
     * 更新学习进度
     */
    updateProgress() {
        // 更新进度点
        this.elements.progressDots.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i < this.currentWordIndex) {
                dot.classList.add('completed');
            } else if (i === this.currentWordIndex) {
                dot.classList.add('current');
            }
            this.elements.progressDots.appendChild(dot);
        }

        // 更新组信息
        this.updateGroupInfo();
    }

    /**
     * 更新组信息
     */
    updateGroupInfo() {
        const currentGroup = Math.floor(this.currentWordIndex / 10) + 1;
        this.elements.currentGroup.textContent = currentGroup;
        this.elements.totalGroups.textContent = Math.ceil(this.currentWords.length / 10);
    }

    /**
     * 显示组完成
     */
    showGroupComplete() {
        this.elements.wordText.textContent = '🎉 恭喜完成本组学习！';
        this.elements.phonetic.textContent = '';
        this.elements.wordMeaning.textContent = `你已经学习了 ${this.currentWordIndex} 个单词！`;
        this.elements.wordExample.textContent = '';
        this.elements.difficultyBadge.style.display = 'none';
        
        this.elements.knowBtn.style.display = 'none';
        this.elements.dontKnowBtn.style.display = 'none';
        this.elements.nextGroupBtn.style.display = 'inline-flex';
        this.elements.prevWordBtn.disabled = true;
    }

    /**
     * 下一组
     */
    async nextGroup() {
        this.elements.nextGroupBtn.style.display = 'none';
        this.elements.knowBtn.style.display = 'inline-flex';
        this.elements.dontKnowBtn.style.display = 'inline-flex';
        this.elements.difficultyBadge.style.display = 'block';
        
        await this.loadNewWords();
        this.displayCurrentWord();
        this.updateProgress();
    }

    /**
     * 上一个单词
     */
    previousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.displayCurrentWord();
            this.updateProgress();
        }
    }

    /**
     * 选择分类
     */
    async selectCategory(category) {
        // 更新按钮状态
        this.elements.categoryBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.userSettings.preferredCategory = category;
        await database.setSetting('preferredCategory', category);
        
        await this.loadNewWords();
        this.displayCurrentWord();
    }

    /**
     * 更新每日进度
     */
    async updateDailyProgress() {
        try {
            const stats = await database.getLearningStats();
            const progress = Math.min(100, (stats.todayLearning / this.userSettings.dailyGoal) * 100);
            
            this.elements.dailyProgress.style.width = `${progress}%`;
            this.elements.progressText.textContent = `${stats.todayLearning}/${this.userSettings.dailyGoal}`;
            
        } catch (error) {
            console.error('更新进度失败:', error);
        }
    }

    /**
     * 加载单词库页面
     */
    async loadWordBankPage() {
        await this.refreshWordBank();
    }

    /**
     * 刷新单词库
     */
    async refreshWordBank() {
        try {
            const words = await database.getWords();
            this.displayWordBank(words);
            this.updateWordBankStats();
        } catch (error) {
            console.error('加载单词库失败:', error);
        }
    }

    /**
     * 显示单词库
     */
    displayWordBank(words) {
        this.elements.wordBankGrid.innerHTML = '';
        
        words.forEach(word => {
            const card = this.createWordBankCard(word);
            this.elements.wordBankGrid.appendChild(card);
        });
    }

    /**
     * 创建单词库卡片
     */
    createWordBankCard(word) {
        const card = document.createElement('div');
        card.className = 'word-bank-card';
        
        card.innerHTML = `
            <div class="word-header">
                <h4>${word.word}</h4>
                <div class="phonetic">${word.phonetic || ''}</div>
            </div>
            <div class="meaning">${word.meaning}</div>
            <div class="card-footer">
                <div class="mastery-indicator">
                    ${Array.from({length: 5}, (_, i) => 
                        `<div class="mastery-dot ${i < (word.masteryLevel || 0) ? 'mastered' : ''}"></div>`
                    ).join('')}
                </div>
                <div class="word-category">${this.getCategoryText(word.category)}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showWordDetails(word);
        });
        
        return card;
    }

    /**
     * 过滤单词库
     */
    async filterWordBank() {
        const searchTerm = this.elements.wordSearch.value;
        const category = this.elements.categoryFilter.value;
        const difficulty = this.elements.difficultyFilter.value;
        
        const words = await database.getWords({
            search: searchTerm,
            category: category,
            difficulty: difficulty
        });
        
        this.displayWordBank(words);
    }

    /**
     * 更新单词库统计
     */
    async updateWordBankStats() {
        try {
            const stats = await database.getLearningStats();
            this.elements.totalWords.textContent = stats.totalWords;
            this.elements.masteredWords.textContent = stats.masteredWords;
            this.elements.learningWords.textContent = stats.learningWords;
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    }

    /**
     * 导入CSV文件
     */
    async importCSV(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            const wordsData = lines.map(line => {
                const [word, phonetic, meaning, example, category, difficulty] = line.split(',');
                return {
                    word: word?.trim(),
                    phonetic: phonetic?.trim(),
                    meaning: meaning?.trim(),
                    example: example?.trim(),
                    category: category?.trim() || 'daily',
                    difficulty: difficulty?.trim() || 'medium'
                };
            }).filter(word => word.word && word.meaning);
            
            if (wordsData.length === 0) {
                throw new Error('没有有效的单词数据');
            }
            
            const result = await database.importWords(wordsData);
            
            if (result.errors.length > 0) {
                this.showError(`导入完成，但有 ${result.errors.length} 个错误: ${result.errors.join(', ')}`);
            } else {
                this.showSuccess(`成功导入 ${result.completed} 个单词！`);
            }
            
            await this.refreshWordBank();
            this.elements.csvInput.value = '';
            
        } catch (error) {
            console.error('导入失败:', error);
            this.showError('导入失败: ' + error.message);
        }
    }

    /**
     * 加载复习页面
     */
    async loadReviewPage() {
        await this.updateReviewStats();
    }

    /**
     * 更新复习统计
     */
    async updateReviewStats() {
        try {
            const wordsForReview = await database.getWordsForReview();
            const stats = await database.getLearningStats();
            const srsStats = srsAlgorithm.getEfficiencyStats();
            
            this.elements.reviewQueueCount.textContent = wordsForReview.length;
            this.elements.todayCompleted.textContent = stats.todayReview;
            this.elements.reviewStreak.textContent = `${srsStats.learningStreak}天`;
            
        } catch (error) {
            console.error('更新复习统计失败:', error);
        }
    }

    /**
     * 开始复习
     */
    async startReview() {
        try {
            const wordsForReview = await database.getWordsForReview();
            
            if (wordsForReview.length === 0) {
                this.showInfo('没有需要复习的单词！');
                return;
            }
            
            this.currentReviewWords = wordsForReview;
            this.currentReviewIndex = 0;
            this.showNextQuizQuestion();
            
        } catch (error) {
            console.error('开始复习失败:', error);
        }
    }

    /**
     * 开始快速复习
     */
    async startQuickReview() {
        const recommendations = srsAlgorithm.getSmartReviewRecommendations(await database.getAllWords(), 10);
        
        if (recommendations.length === 0) {
            this.showInfo('没有推荐复习的单词！');
            return;
        }
        
        this.currentReviewWords = recommendations;
        this.currentReviewIndex = 0;
        this.showNextQuizQuestion();
    }

    /**
     * 显示下一个测验题目
     */
    async showNextQuizQuestion() {
        if (this.currentReviewIndex >= this.currentReviewWords.length) {
            this.showReviewComplete();
            return;
        }
        
        const word = this.currentReviewWords[this.currentReviewIndex];
        
        try {
            // 生成题目选项
            const quizData = await aiService.generateQuizQuestion(word);
            
            // 准备选项
            const options = [
                { text: quizData.correct, correct: true },
                ...quizData.distractors.map(d => ({ text: d, correct: false }))
            ];
            
            this.shuffleArray(options);
            
            // 显示题目
            this.elements.wordToReview.textContent = word.word;
            this.elements.quizOptions.innerHTML = '';
            
            options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'quiz-option';
                button.textContent = option.text;
                button.dataset.correct = option.correct;
                
                button.addEventListener('click', () => {
                    this.handleQuizAnswer(button, option.correct, word);
                });
                
                this.elements.quizOptions.appendChild(button);
            });
            
            this.elements.quizContainer.style.display = 'block';
            this.elements.quizFeedback.textContent = '';
            
        } catch (error) {
            console.error('生成题目失败:', error);
            this.showError('生成题目失败');
        }
    }

    /**
     * 处理测验答案
     */
    async handleQuizAnswer(selectedButton, isCorrect, word) {
        // 禁用所有按钮
        const buttons = this.elements.quizOptions.querySelectorAll('.quiz-option');
        buttons.forEach(btn => btn.disabled = true);
        
        // 显示结果
        if (isCorrect) {
            selectedButton.classList.add('correct');
            this.elements.quizFeedback.textContent = '🎉 正确！';
            this.elements.quizFeedback.className = 'quiz-feedback correct';
            
            // 更新单词状态
            const updatedWord = srsAlgorithm.calculateNextReview(word, 'good');
            await database.updateWord(word.id, updatedWord);
            await database.addLearningRecord({
                wordId: word.id,
                action: 'correct',
                difficulty: word.difficulty
            });
            
            srsAlgorithm.updateUserStats(true);
            
        } else {
            selectedButton.classList.add('incorrect');
            // 显示正确答案
            const correctButton = Array.from(buttons).find(btn => btn.dataset.correct === 'true');
            if (correctButton) {
                correctButton.classList.add('correct');
            }
            
            this.elements.quizFeedback.textContent = `❌ 错误，正确答案是: ${correctButton.textContent}`;
            this.elements.quizFeedback.className = 'quiz-feedback incorrect';
            
            // 更新单词状态
            const updatedWord = srsAlgorithm.calculateNextReview(word, 'again');
            await database.updateWord(word.id, updatedWord);
            await database.addLearningRecord({
                wordId: word.id,
                action: 'incorrect',
                difficulty: word.difficulty
            });
            
            srsAlgorithm.updateUserStats(false);
        }
        
        // 播放单词发音
        speechService.speakWord(word.word, 'word');
        
        // 3秒后进入下一题
        setTimeout(() => {
            this.currentReviewIndex++;
            this.showNextQuizQuestion();
        }, 3000);
    }

    /**
     * 显示复习完成
     */
    showReviewComplete() {
        this.elements.quizContainer.style.display = 'none';
        this.elements.wordToReview.textContent = '🎉 复习完成！';
        this.elements.quizOptions.innerHTML = '';
        this.elements.quizFeedback.textContent = '恭喜完成本次复习！';
        this.elements.quizFeedback.className = 'quiz-feedback correct';
        
        this.updateReviewStats();
        
        setTimeout(() => {
            this.switchPage('progress');
        }, 3000);
    }

    /**
     * 加载进度页面
     */
    async loadProgressPage() {
        await this.updateProgressStats();
        this.updateCharts();
    }

    /**
     * 更新进度统计
     */
    async updateProgressStats() {
        try {
            const stats = await database.getLearningStats();
            const srsStats = srsAlgorithm.getEfficiencyStats();
            const prediction = srsAlgorithm.predictLearningProgress(await database.getAllWords());
            
            this.elements.totalVocab.textContent = stats.totalWords;
            this.elements.todayLearning.textContent = stats.todayLearning;
            this.elements.pendingReview.textContent = stats.pendingReview;
            this.elements.learningStreak.textContent = `${srsStats.learningStreak}天`;
            
            // 更新每日进度
            const progress = Math.min(100, (stats.todayLearning / this.userSettings.dailyGoal) * 100);
            this.elements.dailyProgress.style.width = `${progress}%`;
            this.elements.progressText.textContent = `${stats.todayLearning}/${this.userSettings.dailyGoal}`;
            
        } catch (error) {
            console.error('更新进度统计失败:', error);
        }
    }

    /**
     * 初始化图表
     */
    initCharts() {
        // 学习趋势图表
        this.learningChart = new Chart(document.getElementById('learningChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '每日学习',
                    data: [],
                    borderColor: '#009688',
                    backgroundColor: 'rgba(0, 150, 136, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // 掌握程度分布图表
        this.masteryChart = new Chart(document.getElementById('masteryChart'), {
            type: 'doughnut',
            data: {
                labels: ['未学习', '学习中', '已掌握'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#E9ECEF', '#FFC107', '#28A745']
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    /**
     * 更新图表
     */
    async updateCharts() {
        try {
            // 生成最近7天的学习数据
            const learningData = await this.generateLearningData();
            
            this.learningChart.data.labels = learningData.labels;
            this.learningChart.data.datasets[0].data = learningData.data;
            this.learningChart.update();
            
            // 掌握程度分布
            const words = await database.getAllWords();
            const distribution = {
                notStarted: words.filter(w => w.reviewCount === 0).length,
                learning: words.filter(w => w.reviewCount > 0 && (w.masteryLevel || 0) < 4).length,
                mastered: words.filter(w => (w.masteryLevel || 0) >= 4).length
            };
            
            this.masteryChart.data.datasets[0].data = [
                distribution.notStarted,
                distribution.learning,
                distribution.mastered
            ];
            this.masteryChart.update();
            
        } catch (error) {
            console.error('更新图表失败:', error);
        }
    }

    /**
     * 生成学习数据
     */
    async generateLearningData() {
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            
            // 这里应该从数据库获取实际数据
            // 现在用模拟数据
            data.push(Math.floor(Math.random() * 20) + 5);
        }
        
        return { labels, data };
    }

    /**
     * 加载AI辅助页面
     */
    async loadAIAssistantPage() {
        // 生成初始对话
        if (this.elements.chatMessages.children.length <= 1) {
            await this.generateInitialConversation();
        }
    }

    /**
     * 生成初始对话
     */
    async generateInitialConversation() {
        try {
            const learnedWords = this.learnedWords.slice(-5); // 最近学的5个单词
            const response = await aiService.generateConversation(learnedWords);
            this.addChatMessage(response, false);
        } catch (error) {
            console.error('生成初始对话失败:', error);
        }
    }

    /**
     * 切换AI标签
     */
    switchTab(tabName) {
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    /**
     * 发送聊天消息
     */
    async sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;
        
        // 添加用户消息
        this.addChatMessage(message, true);
        this.elements.chatInput.value = '';
        
        try {
            // 显示加载状态
            this.addLoadingMessage();
            
            // 生成AI响应
            const learnedWords = this.learnedWords.slice(-10);
            const response = await aiService.generateResponse(message, learnedWords);
            
            // 移除加载消息
            this.removeLastMessage();
            
            // 添加AI响应
            this.addChatMessage(response, false);
            
        } catch (error) {
            console.error('生成响应失败:', error);
            this.removeLastMessage();
            this.addChatMessage('抱歉，我现在有点忙，请稍后再试。', false);
        }
    }

    /**
     * 添加聊天消息
     */
    addChatMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${isUser ? 'user' : 'bot'}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // 重新初始化图标
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * 添加加载消息
     */
    addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message loading-message';
        loadingDiv.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-content">
                <p>AI正在思考中...</p>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(loadingDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    /**
     * 移除最后一条消息
     */
    removeLastMessage() {
        const messages = this.elements.chatMessages.children;
        if (messages.length > 0) {
            messages[messages.length - 1].remove();
        }
    }

    /**
     * 生成小说
     */
    async generateNovel() {
        try {
            const style = this.elements.novelStyle.value;
            const words = this.learnedWords.slice(-10); // 最近学的10个单词
            
            if (words.length === 0) {
                this.showInfo('请先学习一些单词，然后再生成小说！');
                return;
            }
            
            // 显示加载状态
            this.elements.generateNovelBtn.disabled = true;
            this.elements.generateNovelBtn.innerHTML = '<i data-lucide="loader"></i> 生成中...';
            
            const novel = await aiService.generateNovel(words, style);
            
            this.elements.novelContent.innerHTML = `
                <div class="novel-text">${novel}</div>
            `;
            
            // 添加单词点击事件
            this.addWordClickEvents();
            
        } catch (error) {
            console.error('生成小说失败:', error);
            this.showError('生成小说失败，请稍后再试');
        } finally {
            this.elements.generateNovelBtn.disabled = false;
            this.elements.generateNovelBtn.innerHTML = '<i data-lucide="sparkles"></i> 生成今日故事';
        }
    }

    /**
     * 添加单词点击事件
     */
    addWordClickEvents() {
        const highlightedWords = this.elements.novelContent.querySelectorAll('.highlighted-word');
        highlightedWords.forEach(word => {
            word.addEventListener('click', () => {
                speechService.speakWord(word.dataset.word, 'word');
            });
        });
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        // 检查是否有示例数据
        const wordCount = await database.getAllWords();
        if (wordCount.length === 0) {
            await this.loadSampleData();
        }
        
        // 更新进度
        await this.updateDailyProgress();
    }

    /**
     * 加载示例数据
     */
    async loadSampleData() {
        const sampleWords = [
            { word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果', example: 'I eat an apple every day.', category: 'daily', difficulty: 'easy' },
            { word: 'beautiful', phonetic: '/ˈbjuːtɪfl/', meaning: '美丽的', example: 'She is a beautiful woman.', category: 'daily', difficulty: 'medium' },
            { word: 'computer', phonetic: '/kəmˈpjuːtər/', meaning: '计算机', example: 'I work on my computer every day.', category: 'tech', difficulty: 'easy' },
            { word: 'education', phonetic: '/ˌedʒuˈkeɪʃn/', meaning: '教育', example: 'Education is very important.', category: 'academic', difficulty: 'medium' },
            { word: 'family', phonetic: '/ˈfæməli/', meaning: '家庭', example: 'I love my family very much.', category: 'daily', difficulty: 'easy' },
            { word: 'success', phonetic: '/səkˈses/', meaning: '成功', example: 'Hard work leads to success.', category: 'business', difficulty: 'medium' },
            { word: 'adventure', phonetic: '/ədˈventʃər/', meaning: '冒险', example: 'The adventure was exciting.', category: 'daily', difficulty: 'medium' },
            { word: 'restaurant', phonetic: '/ˈrestərənt/', meaning: '餐厅', example: 'We had dinner at a restaurant.', category: 'travel', difficulty: 'medium' },
            { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: '挑战', example: 'Learning English is a challenge.', category: 'academic', difficulty: 'hard' },
            { word: 'wonderful', phonetic: '/ˈwʌndərfl/', meaning: '精彩的', example: 'The concert was wonderful.', category: 'daily', difficulty: 'medium' }
        ];
        
        for (const wordData of sampleWords) {
            await database.addWord(wordData);
        }
        
        console.log('示例数据加载完成');
    }

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.userSettings.theme = savedTheme;
        
        // 更新主题切换按钮图标
        const icon = this.elements.themeToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', savedTheme === 'light' ? 'moon' : 'sun');
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.userSettings.theme = newTheme;
        
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
        const icon = this.elements.themeToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', newTheme === 'light' ? 'moon' : 'sun');
        }
        
        // 重新初始化图标
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * 加载用户设置
     */
    async loadUserSettings() {
        this.userSettings.dailyGoal = await database.getSetting('dailyGoal', 20);
        this.userSettings.preferredCategory = await database.getSetting('preferredCategory', 'all');
        
        // 更新UI
        if (this.elements.dailyGoal) {
            this.elements.dailyGoal.value = this.userSettings.dailyGoal;
        }
    }

    /**
     * 更新每日目标
     */
    async updateDailyGoal() {
        const goal = parseInt(this.elements.dailyGoal.value);
        if (goal > 0 && goal <= 100) {
            this.userSettings.dailyGoal = goal;
            await database.setSetting('dailyGoal', goal);
            this.updateDailyProgress();
        }
    }

    /**
     * 更新语音设置
     */
    updateVoiceSettings() {
        const settings = {
            rate: parseFloat(this.elements.voiceSettings.value) || 1.0,
            lang: 'en-US'
        };
        
        speechService.updateSettings(settings);
    }

    /**
     * 隐藏加载界面
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 显示信息消息
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '9999',
            animation: 'slideIn 0.3s ease-out',
            maxWidth: '300px'
        });
        
        // 设置背景色
        const colors = {
            success: '#28A745',
            error: '#DC3545',
            info: '#009688'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 工具函数：数组随机排序
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 工具函数：获取分类文本
     */
    getCategoryText(category) {
        const categories = {
            daily: '日常',
            business: '商务',
            travel: '旅游',
            academic: '学术',
            tech: '技术'
        };
        return categories[category] || category;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化图标
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // 创建应用实例
    window.app = new EnglishLearningApp();
});