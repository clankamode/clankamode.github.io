import './styles.css';
import { initUI } from './ui-scripts';
import './clanka-cmdk';
import { loadContentIndex, createArchiveCard, formatCount, populateSelect } from './content-browser';

type ArchiveFormat = 'all' | 'listen' | 'read';

function archiveFormatFromDataset(value: string | undefined): ArchiveFormat {
  if (value === 'listen' || value === 'read' || value === 'all') return value;
  return 'all';
}

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

  let contentIndex;
  try {
    contentIndex = await loadContentIndex();
  } catch {
    populateSelect(topicSelect, [{ value: 'all', label: 'all topics' }]);
    populateSelect(yearSelect, [{ value: 'all', label: 'all years' }]);
    resultsCount.textContent = 'archive unavailable';
    return;
  }

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
      const postTopics = Array.isArray(post.topics) ? post.topics : [];
      if (topic !== 'all' && !postTopics.some((entry) => entry.slug === topic)) return false;
      if (year !== 'all' && String(post.year) !== year) return false;
      if (selectedFormat === 'listen' && !post.audio) return false;
      if (selectedFormat === 'read' && post.audio) return false;
      if (!query) return true;

      const haystack = `${post.title} ${post.summary} ${postTopics.map((entry) => entry.name).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

    resultsHost.textContent = '';
    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'no dispatches match these filters';
      resultsHost.append(empty);
    } else {
      filtered.forEach((post) => {
        resultsHost.append(createArchiveCard(post));
      });
    }

    resultsCount.textContent = `${formatCount(filtered.length, 'dispatch')} shown`;
  };

  const setFormatButtonState = (activeButton: HTMLButtonElement): void => {
    formatButtons.forEach((entry) => {
      const isActive = entry === activeButton;
      entry.classList.toggle('is-active', isActive);
      entry.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  formatButtons.forEach((button) => {
    button.setAttribute('aria-pressed', button.classList.contains('is-active') ? 'true' : 'false');
    button.addEventListener('click', () => {
      selectedFormat = archiveFormatFromDataset(button.dataset.format);
      setFormatButtonState(button);
      applyFilters();
    });
  });

  searchInput.addEventListener('input', applyFilters);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (searchInput.value) {
      searchInput.value = '';
      applyFilters();
    } else {
      searchInput.blur();
    }
  });
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
