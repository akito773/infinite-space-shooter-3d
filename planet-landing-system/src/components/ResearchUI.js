// 研究ツリーUI

import { RESEARCH_TREE, RESEARCH_CATEGORIES, CATEGORY_INFO } from '../data/research.js';

export class ResearchUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.selectedCategory = RESEARCH_CATEGORIES.PRODUCTION;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインボタン
        this.researchButton = document.createElement('button');
        this.researchButton.className = 'research-button';
        this.researchButton.innerHTML = '🔬 研究';
        this.researchButton.style.cssText = `
            position: fixed;
            top: 80px;
            right: 150px;
            padding: 10px 20px;
            background: linear-gradient(45deg, #4a148c, #7b1fa2);
            color: white;
            border: 2px solid #ab47bc;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 100;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(this.researchButton);
        
        // 研究パネル
        this.researchPanel = document.createElement('div');
        this.researchPanel.className = 'research-panel';
        this.researchPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: rgba(20, 20, 40, 0.95);
            border: 2px solid #ab47bc;
            border-radius: 10px;
            padding: 20px;
            display: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        // パネルコンテンツ
        this.researchPanel.innerHTML = `
            <div class="research-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #ab47bc; font-size: 24px;">研究ツリー</h2>
                <button class="close-btn" style="background: #ff4444; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">✕ 閉じる</button>
            </div>
            
            <div class="research-progress" style="margin-bottom: 20px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">
                <div class="current-research" style="color: white; margin-bottom: 10px;">現在の研究: なし</div>
                <div class="progress-bar" style="width: 100%; height: 20px; background: #333; border-radius: 10px; overflow: hidden;">
                    <div class="progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.3s;"></div>
                </div>
                <div class="progress-text" style="color: #aaa; margin-top: 5px; text-align: center;"></div>
            </div>
            
            <div class="category-tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
                ${Object.entries(CATEGORY_INFO).map(([key, info]) => `
                    <button class="category-tab" data-category="${key}" style="
                        padding: 10px 20px;
                        background: rgba(0,0,0,0.3);
                        color: white;
                        border: 2px solid #${info.color.toString(16).padStart(6, '0')};
                        border-radius: 5px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        ${info.icon} ${info.name}
                    </button>
                `).join('')}
            </div>
            
            <div class="research-content" style="height: 380px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 5px; padding: 10px;">
                <div class="research-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;"></div>
            </div>
            
            <div class="research-stats" style="position: absolute; bottom: 20px; right: 20px; color: #aaa; font-size: 14px;"></div>
        `;
        
        document.body.appendChild(this.researchPanel);
        
        // 要素の参照を保存
        this.closeBtn = this.researchPanel.querySelector('.close-btn');
        this.currentResearchDiv = this.researchPanel.querySelector('.current-research');
        this.progressFill = this.researchPanel.querySelector('.progress-fill');
        this.progressText = this.researchPanel.querySelector('.progress-text');
        this.categoryTabs = this.researchPanel.querySelectorAll('.category-tab');
        this.researchGrid = this.researchPanel.querySelector('.research-grid');
        this.researchStats = this.researchPanel.querySelector('.research-stats');
        
        // 研究システムに自身を登録
        if (this.game.systems.research) {
            this.game.systems.research.researchUI = this;
        }
    }
    
    setupEventListeners() {
        // メインボタン
        this.researchButton.addEventListener('click', () => this.toggle());
        
        // 閉じるボタン
        this.closeBtn.addEventListener('click', () => this.close());
        
        // カテゴリタブ
        this.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.selectedCategory = tab.dataset.category;
                this.updateDisplay();
            });
        });
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.researchPanel.style.display = 'block';
        this.updateDisplay();
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('click');
        }
    }
    
    close() {
        this.isOpen = false;
        this.researchPanel.style.display = 'none';
        
        // サウンド
        if (this.game.systems.sound) {
            this.game.systems.sound.play('click');
        }
    }
    
    updateDisplay() {
        if (!this.game.systems.research) return;
        
        // 現在の研究を更新
        this.updateCurrentResearch();
        
        // カテゴリタブのアクティブ状態を更新
        this.updateCategoryTabs();
        
        // 研究リストを更新
        this.updateResearchList();
        
        // 統計を更新
        this.updateStatistics();
    }
    
    updateCurrentResearch() {
        const currentInfo = this.game.systems.research.getCurrentResearchInfo();
        
        if (currentInfo) {
            this.currentResearchDiv.textContent = `現在の研究: ${currentInfo.research.name}`;
            this.progressFill.style.width = `${currentInfo.progress * 100}%`;
            this.progressText.textContent = `残り時間: ${currentInfo.remainingTime}秒`;
        } else {
            this.currentResearchDiv.textContent = '現在の研究: なし';
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '';
        }
    }
    
    updateCategoryTabs() {
        this.categoryTabs.forEach(tab => {
            if (tab.dataset.category === this.selectedCategory) {
                tab.style.background = 'rgba(171, 71, 188, 0.3)';
                tab.style.transform = 'scale(1.05)';
            } else {
                tab.style.background = 'rgba(0,0,0,0.3)';
                tab.style.transform = 'scale(1)';
            }
        });
    }
    
    updateResearchList() {
        const researches = this.game.systems.research.getResearchByCategory(this.selectedCategory);
        
        this.researchGrid.innerHTML = researches.map(research => {
            let statusClass = '';
            let statusText = '';
            let buttonDisabled = '';
            
            if (research.completed) {
                statusClass = 'completed';
                statusText = '✓ 研究済み';
                buttonDisabled = 'disabled';
            } else if (research.inProgress) {
                statusClass = 'in-progress';
                statusText = '🔬 研究中';
                buttonDisabled = 'disabled';
            } else if (research.inQueue) {
                statusClass = 'queued';
                statusText = '⏳ キュー待機中';
                buttonDisabled = 'disabled';
            } else if (!research.available) {
                statusClass = 'locked';
                statusText = '🔒 条件未達成';
                buttonDisabled = 'disabled';
            } else {
                statusClass = 'available';
                statusText = '研究可能';
            }
            
            return `
                <div class="research-item ${statusClass}" style="
                    background: rgba(0,0,0,0.4);
                    border: 2px solid ${research.completed ? '#4caf50' : research.available ? '#2196f3' : '#666'};
                    border-radius: 8px;
                    padding: 15px;
                    transition: all 0.3s;
                ">
                    <h3 style="margin: 0 0 10px 0; color: ${research.completed ? '#4caf50' : '#fff'}; font-size: 16px;">
                        ${research.name}
                    </h3>
                    <p style="margin: 0 0 10px 0; color: #aaa; font-size: 14px;">
                        ${research.description}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="color: #ffa726; font-size: 14px;">
                            コスト: ${Object.entries(research.cost).map(([res, amt]) => `${res} ${amt}`).join(', ')}
                        </div>
                        <div style="color: #81c784; font-size: 14px;">
                            時間: ${research.time}秒
                        </div>
                    </div>
                    ${research.prerequisites.length > 0 ? `
                        <div style="margin-top: 10px; color: #ff9800; font-size: 12px;">
                            前提: ${research.prerequisites.join(', ')}
                        </div>
                    ` : ''}
                    <button 
                        class="research-btn" 
                        data-research="${research.id}"
                        ${buttonDisabled}
                        style="
                            width: 100%;
                            margin-top: 10px;
                            padding: 8px;
                            background: ${research.available && !research.completed ? 'linear-gradient(45deg, #2196f3, #42a5f5)' : '#555'};
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: ${research.available && !research.completed ? 'pointer' : 'not-allowed'};
                            font-weight: bold;
                            transition: all 0.3s;
                        "
                    >
                        ${statusText}
                    </button>
                </div>
            `;
        }).join('');
        
        // 研究ボタンにイベントリスナーを追加
        this.researchGrid.querySelectorAll('.research-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const researchId = btn.dataset.research;
                const queued = this.game.systems.research.currentResearch !== null;
                this.game.systems.research.startResearch(researchId, queued);
                this.updateDisplay();
            });
        });
    }
    
    updateStatistics() {
        const stats = this.game.systems.research.getStatistics();
        this.researchStats.innerHTML = `
            研究進捗: ${stats.completed}/${stats.total} (${stats.percentage}%)
        `;
    }
    
    // 定期更新
    update() {
        if (this.isOpen) {
            this.updateCurrentResearch();
        }
    }
}