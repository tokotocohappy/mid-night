class MidnightApp {
    constructor() {
        // 状態管理
        this.currentIdx = 0;
        this.answerHistory = []; // 回答の履歴を保存する配列
        
        // 画面要素
        this.screens = {
            title: document.getElementById('title-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen'),
            list: document.getElementById('list-screen')
        };

        // メニュー要素
        this.navOverlay = document.getElementById('nav-overlay');
        this.hamburgerBtn = document.getElementById('hamburger-btn');

        // 初期化実行
        this.initStars();
        this.initListGrid();
    }

    /* ============================================================
       演出・共通処理
       ============================================================ */
    initStars() {
        const container = document.getElementById('stars');
        if (!container) return;
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 1 + 'px';
            star.style.width = size; star.style.height = size;
            star.style.top = Math.random() * 100 + '%'; star.style.left = Math.random() * 100 + '%';
            star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
            container.appendChild(star);
        }
    }

    switchScreen(screenName) {
        Object.values(this.screens).forEach(el => { if(el) el.classList.remove('active'); });
        if(this.screens[screenName]) this.screens[screenName].classList.add('active');
        window.scrollTo(0,0);
    }

    /* ============================================================
       ハンバーガーメニュー
       ============================================================ */
    toggleMenu() {
        if (this.navOverlay && this.hamburgerBtn) {
            this.navOverlay.classList.toggle('active');
            this.hamburgerBtn.classList.toggle('open');
        }
    }

    handleMenu(action) {
        this.toggleMenu();
        setTimeout(() => {
            if (action === 'title') this.reset();
            else if (action === 'start') this.startQuiz();
            else if (action === 'list') this.showList();
        }, 300);
    }

    /* ============================================================
       診断ロジック
       ============================================================ */

    startQuiz() {
        this.currentIdx = 0;
        this.answerHistory = []; // 履歴をリセット
        this.showQuestion();
        this.switchScreen('quiz');
    }

    showQuestion() {
        const q = DATA.questions[this.currentIdx];
        
        // --- プログレスバー（ゲージ）の表示 ---
        // 元のロジック通り「現在の質問番号」に基づいて計算します
        const currentStep = this.currentIdx + 1;
        const totalSteps = DATA.questions.length;
        
        const countEl = document.getElementById("step-count");
        const barEl = document.getElementById("progress-inner");
        
        if(countEl) countEl.innerText = `${currentStep.toString().padStart(2, '0')} / ${totalSteps}`;
        if(barEl) barEl.style.width = `${(currentStep / totalSteps) * 100}%`;
        // ---------------------------------------
        
        // 質問文更新
        const qTextEl = document.getElementById("question-text");
        if(qTextEl) qTextEl.innerText = q.q;
        
        // 選択肢生成
        const optDiv = document.getElementById("options-container");
        if(optDiv) {
            optDiv.innerHTML = "";
            q.a.forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "btn";
                // 戻ってきた時に、以前選んだ選択肢がわかるように色を変える（任意）
                if (this.answerHistory[this.currentIdx] === opt.t) {
                    btn.style.borderColor = "var(--accent)";
                    btn.style.background = "rgba(252, 211, 77, 0.15)";
                }
                btn.innerText = opt.text;
                btn.onclick = () => this.handleAnswer(opt.t);
                optDiv.appendChild(btn);
            });
        }

        // 「戻るボタン」の表示制御（1問目は非表示）
        const prevBtn = document.getElementById("prev-btn");
        if(prevBtn) {
            if (this.currentIdx === 0) {
                prevBtn.style.display = "none";
            } else {
                prevBtn.style.display = "inline-flex"; // cssに合わせてflexかblockで
            }
        }
    }

    // 回答処理
    handleAnswer(type) {
        // 履歴に保存
        this.answerHistory[this.currentIdx] = type;
        
        // 次へ
        this.currentIdx++;
        if (this.currentIdx < DATA.questions.length) {
            this.showQuestion();
        } else {
            this.calcAndShowResult();
        }
    }

    // ★前の質問に戻る処理
    prevQuestion() {
        if (this.currentIdx > 0) {
            this.currentIdx--; // インデックスを戻す
            this.showQuestion(); // 再描画（これでゲージも自動的に戻る）
        }
    }

    // 結果集計
    calcAndShowResult() {
        // 履歴からスコアを計算
        const score = { E:0, I:0, N:0, S:0, F:0, T:0, P:0, J:0 };
        this.answerHistory.forEach(t => { if(score[t] !== undefined) score[t]++; });

        const mbti = (score.E >= score.I ? "E" : "I") + 
                     (score.N >= score.S ? "N" : "S") + 
                     (score.F >= score.T ? "F" : "T") + 
                     (score.P >= score.J ? "P" : "J");
        
        this.renderResultPage(mbti);
        this.switchScreen('result');
    }

    // 結果画面表示
    renderResultPage(mbtiType) {
        const res = DATA.results[mbtiType];
        
        const imgEl = document.getElementById("res-img");
        if(imgEl) {
            imgEl.src = res.img;
            imgEl.onerror = function() {
                this.src = "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=600";
            };
        }

        const typeEl = document.getElementById("res-type");
        const descEl = document.getElementById("res-desc");
        if(typeEl) typeEl.innerText = res.name;
        if(descEl) descEl.innerText = res.desc;

        const songDiv = document.getElementById("res-songs");
        if(songDiv) {
            songDiv.innerHTML = "";
            res.songs.forEach(song => {
                const item = document.createElement("div");
                item.className = "song-item";
                const encodedSong = encodeURIComponent(song);
                const spotifyUrl = `https://open.spotify.com/search/${encodedSong}`;
                const appleUrl = `https://music.apple.com/jp/search?term=${encodedSong}`;
    
                item.innerHTML = `
                    <div class="song-title"><span>♬</span> ${song}</div>
                    <div class="song-links">
                        <a href="${spotifyUrl}" target="_blank" class="platform-link spotify">Spotify</a>
                        <a href="${appleUrl}" target="_blank" class="platform-link apple">Apple Music</a>
                    </div>
                `;
                songDiv.appendChild(item);
            });
        }
    }

    /* ============================================================
       一覧画面
       ============================================================ */
    initListGrid() {
        const grid = document.getElementById("grid-container");
        if(!grid) return;
        Object.keys(DATA.results).forEach(key => {
            const item = DATA.results[key];
            const card = document.createElement("div");
            card.className = "list-card";
            card.onclick = () => {
                this.renderResultPage(key);
                this.switchScreen('result');
            };
            card.innerHTML = `
                <img src="${item.img}" onerror="this.src='https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=200'">
                <div class="list-card-content">
                    <div class="list-mbti">${key}</div>
                    <div class="list-title">${item.name}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    showList() { this.switchScreen('list'); }
    reset() { this.switchScreen('title'); }
}

const app = new MidnightApp();