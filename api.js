const container = document.getElementById('container');
const searchForm = document.getElementById('search-form');
const input = document.getElementById('input');

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

async function getNews(searchQuery) {
    container.innerHTML = '<p class="status">Loading news...</p>';

    try {
        const url = new URL('/api/news', window.location.origin);
        url.searchParams.set('q', searchQuery);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Unable to load news.');
        }

        if (!Array.isArray(data.articles) || data.articles.length === 0) {
            container.innerHTML = '<p class="status">No news articles found.</p>';
            return;
        }

        container.innerHTML = data.articles.map(article => `
            <article class="card">
                <img src="${safeUrl(article.urlToImage) || 'https://placehold.co/240x160/1e293b/ffffff?text=News'}"
                     alt="${escapeHtml(article.title || 'News article')}">
                <div class="content">
                    <h2>${escapeHtml(article.title || 'Untitled')}</h2>
                    <p>${escapeHtml(article.description || 'No description available.')}</p>
                    <a href="${escapeHtml(safeUrl(article.url))}" target="_blank" rel="noopener noreferrer">Read article</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="status error">${error.message}</p>`;
        console.error(error);
    }
}

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const searchQuery = input.value.trim();

    if (!searchQuery) {
        container.innerHTML = '<p class="status">Enter a topic to search.</p>';
        input.focus();
        return;
    }

    getNews(searchQuery);
});

getNews('indore');
