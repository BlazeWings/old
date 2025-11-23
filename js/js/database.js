/**
 * 本地数据库管理模块
 * 使用IndexedDB存储学习数据
 */

class Database {
    constructor() {
        this.dbName = 'EnglishLearningDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('数据库打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('数据库初始化成功');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建单词表
                if (!db.objectStoreNames.contains('words')) {
                    const wordStore = db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
                    wordStore.createIndex('word', 'word', { unique: false });
                    wordStore.createIndex('category', 'category', { unique: false });
                    wordStore.createIndex('difficulty', 'difficulty', { unique: false });
                    wordStore.createIndex('nextReview', 'nextReview', { unique: false });
                    wordStore.createIndex('reviewCount', 'reviewCount', { unique: false });
                }

                // 创建学习记录表
                if (!db.objectStoreNames.contains('learningRecords')) {
                    const recordStore = db.createObjectStore('learningRecords', { keyPath: 'id', autoIncrement: true });
                    recordStore.createIndex('date', 'date', { unique: false });
                    recordStore.createIndex('wordId', 'wordId', { unique: false });
                }

                // 创建用户设置表
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('数据库结构创建完成');
            };
        });
    }

    /**
     * 添加单词
     */
    async addWord(wordData) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        const word = {
            word: wordData.word,
            phonetic: wordData.phonetic || '',
            meaning: wordData.meaning,
            example: wordData.example || '',
            category: wordData.category || 'daily',
            difficulty: wordData.difficulty || 'medium',
            reviewCount: 0,
            masteryLevel: 0,
            createdAt: new Date().toISOString(),
            nextReview: new Date().toISOString(),
            lastReview: null,
            isLearned: false
        };

        return new Promise((resolve, reject) => {
            const request = store.add(word);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取单词列表
     */
    async getWords(filters = {}) {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                let words = request.result;
                
                // 应用过滤条件
                if (filters.category && filters.category !== 'all') {
                    words = words.filter(word => word.category === filters.category);
                }
                
                if (filters.difficulty && filters.difficulty !== 'all') {
                    words = words.filter(word => word.difficulty === filters.difficulty);
                }
                
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    words = words.filter(word => 
                        word.word.toLowerCase().includes(searchTerm) ||
                        word.meaning.toLowerCase().includes(searchTerm)
                    );
                }
                
                resolve(words);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 更新单词
     */
    async updateWord(id, updates) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        return new Promise(async (resolve, reject) => {
            try {
                const word = await this.getWordById(id);
                if (!word) {
                    reject(new Error('单词不存在'));
                    return;
                }
                
                const updatedWord = { ...word, ...updates };
                const request = store.put(updatedWord);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 根据ID获取单词
     */
    async getWordById(id) {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除单词
     */
    async deleteWord(id) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取待复习的单词
     */
    async getWordsForReview() {
        const now = new Date().toISOString();
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const words = request.result.filter(word => 
                    word.nextReview <= now && word.reviewCount > 0
                );
                resolve(words);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 添加学习记录
     */
    async addLearningRecord(record) {
        const transaction = this.db.transaction(['learningRecords'], 'readwrite');
        const store = transaction.objectStore('learningRecords');
        
        const learningRecord = {
            wordId: record.wordId,
            date: new Date().toISOString(),
            action: record.action, // 'learn', 'review', 'correct', 'incorrect'
            difficulty: record.difficulty || 'medium'
        };

        return new Promise((resolve, reject) => {
            const request = store.add(learningRecord);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取学习统计
     */
    async getLearningStats() {
        const transaction = this.db.transaction(['words', 'learningRecords'], 'readonly');
        const wordStore = transaction.objectStore('words');
        const recordStore = transaction.objectStore('learningRecords');
        
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getAllWords(),
                this.getAllRecords()
            ]).then(([words, records]) => {
                const today = new Date().toDateString();
                const todayRecords = records.filter(record => 
                    new Date(record.date).toDateString() === today
                );
                
                const stats = {
                    totalWords: words.length,
                    masteredWords: words.filter(word => word.masteryLevel >= 4).length,
                    learningWords: words.filter(word => word.masteryLevel > 0 && word.masteryLevel < 4).length,
                    todayLearning: todayRecords.filter(record => record.action === 'learn').length,
                    todayReview: todayRecords.filter(record => record.action === 'review').length,
                    pendingReview: words.filter(word => word.nextReview <= new Date().toISOString()).length
                };
                
                resolve(stats);
            }).catch(reject);
        });
    }

    /**
     * 获取所有单词
     */
    async getAllWords() {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有记录
     */
    async getAllRecords() {
        const transaction = this.db.transaction(['learningRecords'], 'readonly');
        const store = transaction.objectStore('learningRecords');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 设置用户设置
     */
    async setSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取用户设置
     */
    async getSetting(key, defaultValue = null) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 批量导入单词
     */
    async importWords(wordsData) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        return new Promise((resolve, reject) => {
            let completed = 0;
            const total = wordsData.length;
            const errors = [];

            wordsData.forEach((wordData, index) => {
                try {
                    const word = {
                        word: wordData.word,
                        phonetic: wordData.phonetic || '',
                        meaning: wordData.meaning,
                        example: wordData.example || '',
                        category: wordData.category || 'daily',
                        difficulty: wordData.difficulty || 'medium',
                        reviewCount: 0,
                        masteryLevel: 0,
                        createdAt: new Date().toISOString(),
                        nextReview: new Date().toISOString(),
                        lastReview: null,
                        isLearned: false
                    };

                    const request = store.add(word);
                    request.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            resolve({ completed, errors });
                        }
                    };
                    request.onerror = () => {
                        errors.push(`第${index + 1}行: ${request.error}`);
                        completed++;
                        if (completed === total) {
                            resolve({ completed, errors });
                        }
                    };
                } catch (error) {
                    errors.push(`第${index + 1}行: ${error.message}`);
                    completed++;
                    if (completed === total) {
                        resolve({ completed, errors });
                    }
                }
            });
        });
    }

    /**
     * 导出单词数据
     */
    async exportWords() {
        const words = await this.getAllWords();
        return words.map(word => ({
            word: word.word,
            phonetic: word.phonetic,
            meaning: word.meaning,
            example: word.example,
            category: word.category,
            difficulty: word.difficulty
        }));
    }

    /**
     * 清空数据库
     */
    async clearDatabase() {
        const transaction = this.db.transaction(['words', 'learningRecords', 'settings'], 'readwrite');
        
        return new Promise((resolve, reject) => {
            Promise.all([
                this.clearStore(transaction.objectStore('words')),
                this.clearStore(transaction.objectStore('learningRecords')),
                this.clearStore(transaction.objectStore('settings'))
            ]).then(() => resolve()).catch(reject);
        });
    }

    /**
     * 清空对象存储
     */
    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// 导出数据库实例
window.database = new Database();