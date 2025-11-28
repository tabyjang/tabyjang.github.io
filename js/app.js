// 메인 애플리케이션 로직
(function() {
    'use strict';

    let allPosts = [];
    let displayedPosts = [];
    let activeTagFilter = null;

    const postsContainer = document.getElementById('posts-container');
    const tagFiltersContainer = document.getElementById('tag-filters');

    // posts.json 로딩
    async function loadPosts() {
        try {
            const response = await fetch('posts.json');
            if (!response.ok) {
                throw new Error('posts.json을 불러올 수 없습니다.');
            }
            allPosts = await response.json();
            displayedPosts = allPosts;
            
            // search.js에 posts 전달
            if (window.setSearchPosts) {
                window.setSearchPosts(allPosts);
            }
            
            renderPosts(displayedPosts);
            renderTagFilters();
        } catch (error) {
            console.error('게시글 로딩 오류:', error);
            postsContainer.innerHTML = '<p class="no-posts">게시글을 불러올 수 없습니다.</p>';
        }
    }

    // 게시글 렌더링
    function renderPosts(posts) {
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">검색 결과가 없습니다.</p>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => {
            const tagsHtml = post.tags.map(tag => 
                `<span class="tag">${escapeHtml(tag)}</span>`
            ).join('');

            return `
                <a href="post.html?file=${encodeURIComponent(post.file)}" class="post-card">
                    <h2>${escapeHtml(post.title)}</h2>
                    <div class="post-meta">
                        <span class="post-date">${escapeHtml(post.date)}</span>
                        ${post.category ? `<span class="post-category">${escapeHtml(post.category)}</span>` : ''}
                    </div>
                    ${post.excerpt ? `<p class="excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
                    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
                </a>
            `;
        }).join('');
    }

    // 태그 필터 렌더링
    function renderTagFilters() {
        const allTags = new Set();
        allPosts.forEach(post => {
            post.tags.forEach(tag => allTags.add(tag));
        });

        const sortedTags = Array.from(allTags).sort();
        
        if (sortedTags.length === 0) {
            tagFiltersContainer.innerHTML = '';
            return;
        }

        tagFiltersContainer.innerHTML = `
            <button class="tag-filter ${activeTagFilter === null ? 'active' : ''}" data-tag="all">
                전체
            </button>
            ${sortedTags.map(tag => `
                <button class="tag-filter ${activeTagFilter === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
                    ${escapeHtml(tag)}
                </button>
            `).join('')}
        `;

        // 태그 필터 클릭 이벤트
        tagFiltersContainer.querySelectorAll('.tag-filter').forEach(button => {
            button.addEventListener('click', () => {
                const tag = button.getAttribute('data-tag');
                if (tag === 'all') {
                    activeTagFilter = null;
                } else {
                    activeTagFilter = tag;
                }
                renderTagFilters();
                applyFilters();
            });
        });
    }

    // 필터 적용
    function applyFilters() {
        let filtered = allPosts;

        // 태그 필터
        if (activeTagFilter) {
            filtered = filtered.filter(post => 
                post.tags.includes(activeTagFilter)
            );
        }

        // 검색 필터 (search.js에서 설정된 값 사용)
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value.trim()) {
            const query = searchInput.value.toLowerCase();
            filtered = filtered.filter(post => {
                const titleMatch = post.title.toLowerCase().includes(query);
                const excerptMatch = post.excerpt.toLowerCase().includes(query);
                const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query));
                return titleMatch || excerptMatch || tagMatch;
            });
        }

        displayedPosts = filtered;
        renderPosts(displayedPosts);
    }

    // 검색 업데이트 이벤트 리스너
    window.addEventListener('searchUpdate', (e) => {
        const { posts, query } = e.detail;
        
        // 검색어가 있으면 검색 결과 사용, 없으면 태그 필터만 적용
        if (query.trim()) {
            let filtered = posts;
            if (activeTagFilter) {
                filtered = filtered.filter(post => 
                    post.tags.includes(activeTagFilter)
                );
            }
            displayedPosts = filtered;
        } else {
            applyFilters();
            return;
        }
        
        renderPosts(displayedPosts);
    });

    // HTML 이스케이프
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 초기화
    if (postsContainer) {
        loadPosts();
    }
})();

