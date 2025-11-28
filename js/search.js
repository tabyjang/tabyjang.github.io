// 검색 기능 모듈
(function() {
    'use strict';

    const searchInput = document.getElementById('search-input');
    let searchPosts = [];
    let searchFilteredPosts = [];

    // 검색어로 게시글 필터링
    function filterPostsBySearch(query) {
        if (!query.trim()) {
            return searchPosts;
        }

        const lowerQuery = query.toLowerCase();
        return searchPosts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(lowerQuery);
            const excerptMatch = post.excerpt.toLowerCase().includes(lowerQuery);
            const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            return titleMatch || excerptMatch || tagMatch;
        });
    }

    // 검색 이벤트
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            searchFilteredPosts = filterPostsBySearch(query);
            
            // 커스텀 이벤트 발생 (app.js에서 처리)
            window.dispatchEvent(new CustomEvent('searchUpdate', {
                detail: { posts: searchFilteredPosts, query: query }
            }));
        });
    }

    // 외부에서 posts 데이터 설정
    window.setSearchPosts = function(posts) {
        searchPosts = posts;
        searchFilteredPosts = posts;
    };
})();

