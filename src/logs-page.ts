import './styles.css';
import { initUI } from './ui-scripts';
import './clanka-cmdk';
import { loadContentIndex, createArchiveCard, formatCount, populateSelect } from './content-browser';

type ArchiveFormat = 'all' | 'listen' | 'read';

async function renderArchivePage(): Promise<void> {
  const searchInput = document.getElementById('archive-search-input') as HTMLInputElement | null;
  const topicSelect = document.getElementById('archive-topic-select') as HTMLSelectElement | null;
  const yearSelect = document.getElementById('archive-year-select') as HTMLSelectElement | null;
  const resultsCount = document.getElementById('archive-results-count');
  const resultsHost = document.getElementById('archive-results');
  const formatButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.archive-format-buttons .filter-chip'));

  if (!searchInput || !topicSelect || !yearSelect || !resultsCount || !resultsHost) {
    return;
  }

  const contentIndex = await loadContentIndex();

  populateSelect(topicSelect, [
    { value: 'all', label: 'all topics' },
    ...contentIndex.topics.map((topic) => ({ value: topic.slug, label: topic.name.toLowerCase() })),
  ]);
  populateSelect(yearSelect, [
    { value: 'all', label: 'all years' },
    ...contentIndex.homepage.years.map((year) => ({ value: String(year), label: String(year) })),
  ]);

  let selectedFormat: ArchiveFormat = 'all';

  const applyFilters = (): void => {
    const query = searchInput.value.trim().toLowerCase();
    const topic = topicSelect.value;
    const year = yearSelect.value;

    const filtered = contentIndex.posts.filter((post) => {
      if (topic !== 'all' && !post.topics.some((entry) => entry.slug === topic)) return false;
      if (year !== 'all' && String(post.year) !== year) return false;
      if (selectedFormat === 'listen' && !post.audio) return false;
      if (selectedFormat === 'read' && post.audio) return false;
      if (!query) return true;

      const haystack = `${post.title} ${post.summary} ${post.topics.map((entry) => entry.name).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

    resultsHost.textContent = '';
    filtered.forEach((post) => {
      resultsHost.append(createArchiveCard(post));
    });

    resultsCount.textContent = `${formatCount(filtered.length, 'dispatch')} shown`;
  };

  formatButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedFormat = button.dataset.format as ArchiveFormat;
      formatButtons.forEach((entry) => entry.classList.toggle('is-active', entry === button));
      applyFilters();
    });
  });

  searchInput.addEventListener('input', applyFilters);
  topicSelect.addEventListener('change', applyFilters);
  yearSelect.addEventListener('change', applyFilters);

  window.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  });

  applyFilters();
}

initUI();
void renderArchivePage();
