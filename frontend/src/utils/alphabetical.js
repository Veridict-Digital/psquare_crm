/**
 * Shared alphabetical sorting for dropdowns and option lists.
 */

const PLACEHOLDER_RE = /^(all\b|select\b|choose\b|any\b|pick\b|--+|—+|not set|not assigned)/i;
const ACTION_RE = /^(add new|create new|create\b|\+ )/i;

export function compareAlpha(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

/** Sort an array of strings, or objects via getLabel. Returns a new array. */
export function sortAlphabetically(items, getLabel = (item) => item) {
  if (!Array.isArray(items) || items.length < 2) {
    return Array.isArray(items) ? [...items] : [];
  }
  return [...items].sort((a, b) => compareAlpha(getLabel(a), getLabel(b)));
}

/** Normalize API list payloads ({results:[]} or []). */
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/** Default label for CRM entities (name / title / username). */
export function defaultOptionLabel(item) {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
  return (
    item.name ||
    item.title ||
    item.label ||
    fullName ||
    item.username ||
    item.display_name ||
    String(item.id ?? '')
  );
}

/** Sort any API list by defaultOptionLabel — use as react-query `select`. */
export function selectSortedByName(data) {
  return sortAlphabetically(asList(data), defaultOptionLabel);
}

/** Keep paginated shape but sort results. */
export function selectSortedResults(data) {
  if (!data || Array.isArray(data)) return selectSortedByName(data);
  return {
    ...data,
    results: sortAlphabetically(asList(data), defaultOptionLabel),
  };
}

export function isPlaceholderOption(option) {
  if (!option) return false;
  const value = String(option.value ?? '').trim();
  const text = String(option.textContent ?? option.label ?? option.text ?? '').trim();
  if (value === '' || value === 'null' || value === 'undefined') return true;
  if (!text) return true;
  return PLACEHOLDER_RE.test(text);
}

export function isActionOption(option) {
  if (!option) return false;
  const value = String(option.value ?? '').trim().toLowerCase();
  const text = String(option.textContent ?? option.label ?? option.text ?? '').trim();
  if (value === 'add_new' || value === 'create_new') return true;
  return ACTION_RE.test(text);
}

/**
 * Reorder <option> nodes inside a <select> alphabetically.
 * Placeholders (All / Select / empty) stay on top; "Add New" stays at the bottom.
 * Skips selects marked data-no-alpha-sort.
 */
export function sortSelectElement(select) {
  if (!select || select.tagName !== 'SELECT') return false;
  if (select.dataset.noAlphaSort === 'true' || select.hasAttribute('data-no-alpha-sort')) {
    return false;
  }
  // Leave multi-size listboxes / custom widgets alone if opted out via slow-scroll sibling patterns
  if (select.multiple && select.size > 1 && select.dataset.alphaSort !== 'true') {
    // Still sort multi-selects unless explicitly skipped — user asked for all dropdowns
  }

  const options = Array.from(select.children).filter((el) => el.tagName === 'OPTION');
  if (options.length < 2) return false;

  const top = [];
  const middle = [];
  const bottom = [];

  options.forEach((opt) => {
    if (isPlaceholderOption(opt)) top.push(opt);
    else if (isActionOption(opt)) bottom.push(opt);
    else middle.push(opt);
  });

  middle.sort((a, b) => compareAlpha(a.textContent, b.textContent));
  // Stable-ish placeholder order: keep relative order among placeholders
  bottom.sort((a, b) => compareAlpha(a.textContent, b.textContent));

  const desired = [...top, ...middle, ...bottom];
  const unchanged = desired.every((opt, i) => opt === options[i]);
  if (unchanged) return false;

  const selected = select.value;
  desired.forEach((opt) => select.appendChild(opt));
  // Restore selection by value (index may have changed)
  if (selected !== undefined && selected !== null) {
    select.value = selected;
  }
  return true;
}

export function sortAllSelects(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  let count = 0;
  root.querySelectorAll('select').forEach((select) => {
    if (sortSelectElement(select)) count += 1;
  });
  return count;
}
