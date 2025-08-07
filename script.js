
class ReadingApp {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('readingRecords')) || [];
        this.currentScreen = 'main';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderRecords();
    }

    setupEventListeners() {
        // 화면 전환
        document.getElementById('recommendBtn').addEventListener('click', () => {
            this.showScreen('recommend');
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showScreen('main');
        });

        // 독서 기록 추가
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // 키워드 버튼들
        document.querySelectorAll('.keyword-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectKeyword(e.target);
                this.searchBooks(e.target.dataset.keyword);
            });
        });

        // 커스텀 키워드 검색
        document.getElementById('searchCustomBtn').addEventListener('click', () => {
            const keyword = document.getElementById('customKeyword').value.trim();
            if (keyword) {
                this.searchBooks(keyword);
            }
        });

        document.getElementById('customKeyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const keyword = e.target.value.trim();
                if (keyword) {
                    this.searchBooks(keyword);
                }
            }
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (screenName === 'main') {
            document.getElementById('mainScreen').classList.add('active');
        } else if (screenName === 'recommend') {
            document.getElementById('recommendScreen').classList.add('active');
        }
        
        this.currentScreen = screenName;
    }

    addRecord() {
        const title = document.getElementById('bookTitle').value.trim();
        const review = document.getElementById('bookReview').value.trim();

        if (!title || !review) {
            alert('책 제목과 감상을 모두 입력해주세요.');
            return;
        }

        const record = {
            id: Date.now(),
            title: title,
            review: review,
            date: new Date().toLocaleDateString('ko-KR')
        };

        this.records.unshift(record);
        this.saveRecords();
        this.renderRecords();

        // 폼 초기화
        document.getElementById('recordForm').reset();
        
        alert('독서 기록이 추가되었습니다!');
    }

    deleteRecord(id) {
        if (confirm('이 기록을 삭제하시겠습니까?')) {
            this.records = this.records.filter(record => record.id !== id);
            this.saveRecords();
            this.renderRecords();
        }
    }

    renderRecords() {
        const recordsList = document.getElementById('recordsList');
        
        if (this.records.length === 0) {
            recordsList.innerHTML = '<div class="no-results">아직 독서 기록이 없습니다. 첫 번째 기록을 추가해보세요!</div>';
            return;
        }

        recordsList.innerHTML = this.records.map(record => `
            <div class="record-card">
                <div class="record-date">${record.date}</div>
                <h3>${this.escapeHtml(record.title)}</h3>
                <p>${this.escapeHtml(record.review)}</p>
                <button class="delete-btn" onclick="app.deleteRecord(${record.id})">삭제</button>
            </div>
        `).join('');
    }

    selectKeyword(selectedBtn) {
        document.querySelectorAll('.keyword-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedBtn.classList.add('active');
    }

    async searchBooks(keyword) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const recommendationsList = document.getElementById('recommendationsList');
        
        loadingSpinner.classList.remove('hidden');
        recommendationsList.innerHTML = '';

        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(keyword)}&langRestrict=ko&maxResults=12&orderBy=relevance`
            );

            if (!response.ok) {
                throw new Error('네트워크 오류가 발생했습니다.');
            }

            const data = await response.json();
            
            loadingSpinner.classList.add('hidden');

            if (!data.items || data.items.length === 0) {
                recommendationsList.innerHTML = '<div class="no-results">해당 키워드로 검색된 책이 없습니다.</div>';
                return;
            }

            this.renderRecommendations(data.items);

        } catch (error) {
            loadingSpinner.classList.add('hidden');
            console.error('Error searching books:', error);
            recommendationsList.innerHTML = '<div class="no-results">책 검색 중 오류가 발생했습니다. 다시 시도해주세요.</div>';
        }
    }

    renderRecommendations(books) {
        const recommendationsList = document.getElementById('recommendationsList');
        
        recommendationsList.innerHTML = books.map(book => {
            const volumeInfo = book.volumeInfo;
            const title = volumeInfo.title || '제목 없음';
            const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : '작가 정보 없음';
            const description = volumeInfo.description ? 
                volumeInfo.description.substring(0, 150) + '...' : 
                '설명이 없습니다.';
            const thumbnail = volumeInfo.imageLinks ? 
                volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail :
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDEyMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik0zNSA1MEg4NVY2MEgzNVY1MFoiIGZpbGw9IiNFMkU4RjAiLz4KPHA+YXRoIGQ9Ik0zNSA3MEg4NVY4MEgzNVY3MFoiIGZpbGw9IiNFMkU4RjAiLz4KPHA+YXRoIGQ9Ik0zNSA5MEg2NVYxMDBIMzVWOTBaIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo=';
            
            // 구매 링크 처리
            const infoLink = volumeInfo.infoLink || volumeInfo.canonicalVolumeLink;
            const buyLink = book.saleInfo && book.saleInfo.buyLink ? book.saleInfo.buyLink : infoLink;

            return `
                <div class="book-card" onclick="window.open('${buyLink}', '_blank')" style="cursor: pointer;">
                    <img src="${thumbnail}" alt="${this.escapeHtml(title)}" class="book-cover" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDEyMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik0zNSA1MEg4NVY2MEgzNVY1MFoiIGZpbGw9IiNFMkU4RjAiLz4KPHA+YXRoIGQ9Ik0zNSA3MEg4NVY4MEgzNVY3MFoiIGZpbGw9IiNFMkU4RjAiLz4KPHA+YXRoIGQ9Ik0zNSA5MEg2NVYxMDBIMzVWOTBaIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo='">
                    <h3>${this.escapeHtml(title)}</h3>
                    <div class="book-author">${this.escapeHtml(authors)}</div>
                    <div class="book-description">${this.escapeHtml(description)}</div>
                    <div class="book-link-hint">📖 클릭하여 자세히 보기</div>
                </div>
            `;
        }).join('');
    }

    saveRecords() {
        localStorage.setItem('readingRecords', JSON.stringify(this.records));
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// 앱 초기화
const app = new ReadingApp();
