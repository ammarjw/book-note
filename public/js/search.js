document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query.length >= 3) {
            const response = await fetch(`/search?title=${encodeURIComponent(query)}`);
            const results = await response.json();
            updateResults(results);
        } else {
            resultsContainer.innerHTML = ''; // Clear results if input is less than 3 characters
            resultsContainer.style.display = 'none'; // Hide the results
        }
    });

    function updateResults(books) {
        resultsContainer.innerHTML = ''; // Clear previous results
        if (books.length > 0) {
            resultsContainer.style.display = 'block'; // Show the results container
            books.forEach(book => {
                const bookElement = document.createElement('div');
                bookElement.classList.add('d-flex', 'mb-2', 'p-2', 'border-bottom', 'border-light');

                bookElement.innerHTML = `
                    <div class="d-flex gap-2">
                        <a href='/add/${book.id}'>
                            <img src="${book.coverImage}" alt="${book.title}" style="width: 120px; height: 175px;">
                        </a>
                        <div>
                            <a href='/add/${book.id}'><h6 class="mb-1 text-light">${book.title}</h6></a>
                            <p class="mb-0"><strong>Author:</strong> ${book.author}</p>
                            <p class="mb-0"><strong>Genre:</strong> ${book.genre}</p>
                            <p class="mb-0">${book.summary.substring(0, 50) + '...'}</p>
                        </div>
                    </div>
                `;

                resultsContainer.appendChild(bookElement);
            });
        } else {
            resultsContainer.style.display = 'none'; // Hide if no results
        }
    }
});
