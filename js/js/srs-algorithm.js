/**
 * 间隔重复算法(SRS)模块
 * 实现改进的SM-2算法和Leitner系统
 */

class SRSAlgorithm {
    constructor() {
        // SM-2算法参数
        this.baseInterval = 1; // 基础间隔天数
        this.easeFactor = 2.5; // 难度因子
        this.minimumEaseFactor = 1.3; // 最小难度因子
        
        // Leitner系统参数
        this.leitnerBoxes = 5; // Leitner盒子数量
        this.hardBoxReviewInterval = 1; // 困难盒子复习间隔（天）
        this.maxHardBoxAttempts = 3; // 最大困难盒子尝试次数
        
        // 用户统计数据
        this.userStats = {
            totalReviews: 0,
            correctReviews: 0,
            consecutiveCorrect: 0,
            consecutiveIncorrect: 0,
            lastReviewDate: null,
            learningStreak: 0
        };
    }

    /**
     * 计算下次复习时间（SM-2算法）
     * @param {Object} word - 单词对象
     * @param {string} response - 用户回答质量：'again', 'hard', 'good', 'easy'
     * @returns {Object} 更新后的单词对象
     */
    calculateNextReview(word, response) {
        const now = new Date();
        let updatedWord = { ...word };
        
        // 根据回答质量调整难度因子和间隔
        switch (response) {
            case 'again':
                updatedWord.easeFactor = Math.max(
                    this.minimumEaseFactor, 
                    word.easeFactor * 0.8 - 0.15
                );
                updatedWord.reviewCount = 0;
                updatedWord.masteryLevel = Math.max(0, word.masteryLevel - 1);
                break;
                
            case 'hard':
                updatedWord.easeFactor = Math.max(
                    this.minimumEaseFactor, 
                    word.easeFactor * 0.85 - 0.05
                );
                updatedWord.reviewCount = Math.max(1, word.reviewCount);
                updatedWord.masteryLevel = Math.max(0, word.masteryLevel - 0.5);
                break;
                
            case 'good':
                updatedWord.easeFactor = Math.max(
                    this.minimumEaseFactor, 
                    word.easeFactor + 0.1 - (0.08 + (0.02 * word.reviewCount))
                );
                updatedWord.reviewCount += 1;
                updatedWord.masteryLevel = Math.min(5, word.masteryLevel + 0.5);
                break;
                
            case 'easy':
                updatedWord.easeFactor = Math.max(
                    this.minimumEaseFactor, 
                    word.easeFactor + 0.15 - (0.15 + (0.01 * word.reviewCount))
                );
                updatedWord.reviewCount += 1;
                updatedWord.masteryLevel = Math.min(5, word.masteryLevel + 1);
                break;
        }
        
        // 计算下次复习间隔
        const interval = this.calculateReviewInterval(
            updatedWord.reviewCount, 
            updatedWord.easeFactor,
            word.difficulty
        );
        
        // 设置下次复习时间
        const nextReviewTime = new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000));
        updatedWord.nextReview = nextReviewTime.toISOString();
        updatedWord.lastReview = now.toISOString();
        
        return updatedWord;
    }

    /**
     * 计算复习间隔
     * @param {number} reviewCount - 复习次数
     * @param {number} easeFactor - 难度因子
     * @param {string} difficulty - 难度级别
     * @returns {number} 间隔天数
     */
    calculateReviewInterval(reviewCount, easeFactor, difficulty) {
        // 根据难度级别调整基础间隔
        let difficultyMultiplier = 1.0;
        switch (difficulty) {
            case 'easy':
                difficultyMultiplier = 0.8;
                break;
            case 'medium':
                difficultyMultiplier = 1.0;
                break;
            case 'hard':
                difficultyMultiplier = 1.5;
                break;
        }
        
        // SM-2算法间隔计算
        let interval;
        if (reviewCount === 0) {
            interval = this.baseInterval;
        } else if (reviewCount === 1) {
            interval = 6;
        } else {
            interval = Math.round(
                (this.baseInterval * easeFactor * reviewCount * difficultyMultiplier)
            );
        }
        
        // 最小和最大间隔限制
        return Math.max(1, Math.min(365, interval));
    }

    /**
     * Leitner系统：安排困难单词的强制复习
     * @param {Object} word - 单词对象
     * @param {boolean} wasCorrect - 回答是否正确
     * @returns {Object} 更新后的单词对象
     */
    applyLeitnerSystem(word, wasCorrect) {
        const updatedWord = { ...word };
        const now = new Date();
        
        // 如果回答错误，移入困难盒子
        if (!wasCorrect) {
            updatedWord.leitnerBox = Math.max(1, (word.leitnerBox || this.leitnerBoxes) - 1);
            updatedWord.hardBoxAttempts = (word.hardBoxAttempts || 0) + 1;
            
            // 设置强制复习时间（24小时内）
            const forceReviewTime = new Date(now.getTime() + (this.hardBoxReviewInterval * 24 * 60 * 60 * 1000));
            updatedWord.forceReviewTime = forceReviewTime.toISOString();
            
            // 如果在困难盒子中连续错误3次，保持在困难盒子
            if (updatedWord.hardBoxAttempts >= this.maxHardBoxAttempts) {
                updatedWord.reviewCount = 0; // 重置复习计数
                updatedWord.masteryLevel = 0; // 重置掌握程度
                updatedWord.hardBoxAttempts = 0; // 重置尝试次数
            }
        } else {
            // 回答正确，可以进入下一个盒子
            updatedWord.leitnerBox = Math.min(this.leitnerBoxes, (word.leitnerBox || 1) + 1);
            updatedWord.hardBoxAttempts = 0; // 重置困难盒子尝试次数
            
            // 如果移出了困难盒子，恢复正常SRS间隔
            if (updatedWord.leitnerBox > 1) {
                const interval = this.calculateReviewInterval(
                    updatedWord.reviewCount,
                    updatedWord.easeFactor || this.easeFactor,
                    word.difficulty
                );
                const nextReviewTime = new Date(now.getTime() + (interval * 24 * 60 * 60 * 1000));
                updatedWord.nextReview = nextReviewTime.toISOString();
                delete updatedWord.forceReviewTime;
            }
        }
        
        return updatedWord;
    }

    /**
     * 获取需要复习的单词
     * @param {Array} words - 所有单词
     * @returns {Array} 需要复习的单词
     */
    getWordsForReview(words) {
        const now = new Date();
        const reviewWords = [];
        
        words.forEach(word => {
            const nextReview = new Date(word.nextReview);
            const forceReview = word.forceReviewTime ? new Date(word.forceReviewTime) : null;
            
            // 检查是否到期复习
            if (nextReview <= now || (forceReview && forceReview <= now)) {
                reviewWords.push(word);
            }
        });
        
        // 按优先级排序：强制复习的单词优先
        return reviewWords.sort((a, b) => {
            const aForce = a.forceReviewTime ? new Date(a.forceReviewTime) : new Date('2099-12-31');
            const bForce = b.forceReviewTime ? new Date(b.forceReviewTime) : new Date('2099-12-31');
            return aForce - bForce;
        });
    }

    /**
     * 更新用户统计数据
     * @param {boolean} wasCorrect - 回答是否正确
     */
    updateUserStats(wasCorrect) {
        this.userStats.totalReviews++;
        
        if (wasCorrect) {
            this.userStats.correctReviews++;
            this.userStats.consecutiveCorrect++;
            this.userStats.consecutiveIncorrect = 0;
        } else {
            this.userStats.consecutiveIncorrect++;
            this.userStats.consecutiveCorrect = 0;
        }
        
        this.userStats.lastReviewDate = new Date().toDateString();
        
        // 更新连续学习天数
        this.updateLearningStreak();
    }

    /**
     * 更新连续学习天数
     */
    updateLearningStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (this.userStats.lastReviewDate === today) {
            // 今天已经学习过，不更新
            return;
        } else if (this.userStats.lastReviewDate === yesterday) {
            // 昨天学习过，今天继续
            this.userStats.learningStreak++;
        } else {
            // 中断了连续学习
            this.userStats.learningStreak = 1;
        }
    }

    /**
     * 获取学习效率统计
     * @returns {Object} 效率统计
     */
    getEfficiencyStats() {
        const accuracy = this.userStats.totalReviews > 0 
            ? (this.userStats.correctReviews / this.userStats.totalReviews) * 100 
            : 0;
        
        return {
            accuracy: Math.round(accuracy),
            totalReviews: this.userStats.totalReviews,
            correctReviews: this.userStats.correctReviews,
            consecutiveCorrect: this.userStats.consecutiveCorrect,
            consecutiveIncorrect: this.userStats.consecutiveIncorrect,
            learningStreak: this.userStats.learningStreak,
            lastReviewDate: this.userStats.lastReviewDate
        };
    }

    /**
     * 生成复习计划
     * @param {Array} words - 所有单词
     * @returns {Object} 复习计划
     */
    generateReviewPlan(words) {
        const now = new Date();
        const reviewWords = this.getWordsForReview(words);
        
        const plan = {
            today: [],
            thisWeek: [],
            thisMonth: [],
            overdue: []
        };
        
        reviewWords.forEach(word => {
            const nextReview = new Date(word.nextReview);
            const daysDiff = Math.ceil((nextReview - now) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 0) {
                plan.today.push(word);
            } else if (daysDiff <= 7) {
                plan.thisWeek.push(word);
            } else if (daysDiff <= 30) {
                plan.thisMonth.push(word);
            } else {
                plan.overdue.push(word);
            }
        });
        
        return plan;
    }

    /**
     * 智能推荐复习内容
     * @param {Array} words - 所有单词
     * @param {number} maxCount - 最大推荐数量
     * @returns {Array} 推荐复习的单词
     */
    getSmartReviewRecommendations(words, maxCount = 20) {
        const reviewWords = this.getWordsForReview(words);
        
        // 按优先级评分
        const scoredWords = reviewWords.map(word => {
            let score = 0;
            
            // 强制复习优先
            if (word.forceReviewTime) {
                score += 100;
            }
            
            // 根据掌握程度调整（掌握程度低的优先）
            score += (5 - (word.masteryLevel || 0)) * 10;
            
            // 根据复习次数调整（复习次数少的优先）
            score += (10 - (word.reviewCount || 0)) * 5;
            
            // 根据难度调整（困难的优先）
            const difficultyScore = { easy: 1, medium: 2, hard: 3 };
            score += difficultyScore[word.difficulty] || 2;
            
            // 根据距离下次复习时间调整
            const nextReview = new Date(word.nextReview);
            const daysDiff = Math.ceil((nextReview - new Date()) / (1000 * 60 * 60 * 24));
            score += Math.max(0, 20 - daysDiff);
            
            return { ...word, priorityScore: score };
        });
        
        // 按评分排序并返回前N个
        return scoredWords
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, maxCount);
    }

    /**
     * 预测学习进度
     * @param {Array} words - 所有单词
     * @returns {Object} 进度预测
     */
    predictLearningProgress(words) {
        const totalWords = words.length;
        const learnedWords = words.filter(word => word.reviewCount > 0).length;
        const masteredWords = words.filter(word => (word.masteryLevel || 0) >= 4).length;
        
        // 计算平均复习间隔
        const reviewWords = words.filter(word => word.reviewCount > 0);
        const avgReviewCount = reviewWords.length > 0 
            ? reviewWords.reduce((sum, word) => sum + (word.reviewCount || 0), 0) / reviewWords.length
            : 0;
        
        // 预测完成时间（基于当前学习速度）
        const remainingWords = totalWords - masteredWords;
        const dailyLearningRate = Math.min(20, learnedWords / Math.max(1, this.userStats.learningStreak));
        const estimatedDaysToMaster = dailyLearningRate > 0 ? remainingWords / dailyLearningRate : Infinity;
        
        return {
            totalWords,
            learnedWords,
            masteredWords,
            progressPercentage: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
            avgReviewCount: Math.round(avgReviewCount * 10) / 10,
            estimatedDaysToMaster: Math.ceil(estimatedDaysToMaster),
            dailyLearningRate: Math.round(dailyLearningRate * 10) / 10
        };
    }
}

// 导出SRS算法实例
window.srsAlgorithm = new SRSAlgorithm();