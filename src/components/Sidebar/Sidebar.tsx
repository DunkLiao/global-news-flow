import { CATEGORIES } from '../../constants/categories';
import { COUNTRIES } from '../../constants/countries';
import styles from './Sidebar.module.css';

interface SidebarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  isSearchMode: boolean;
}

export function Sidebar({
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  country,
  onCountryChange,
  isSearchMode,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="篩選與搜尋">
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden>
          N
        </div>
        <div>
          <h1 className={styles.appName}>NewsFlow</h1>
          <p className={styles.tagline}>每日新聞聚合</p>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="news-search">
          搜尋新聞
        </label>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            ⌕
          </span>
          <input
            id="news-search"
            type="search"
            className={styles.searchInput}
            placeholder="輸入關鍵字…"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            autoComplete="off"
          />
          {keyword && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => onKeywordChange('')}
              aria-label="清除搜尋"
            >
              ×
            </button>
          )}
        </div>
        {isSearchMode && (
          <p className={styles.hint}>搜尋模式：使用全站關鍵字（不受地區／類別限制）</p>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.label} id="category-label">
          類別
        </p>
        <div
          className={styles.pills}
          role="group"
          aria-labelledby="category-label"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id || 'all'}
                type="button"
                className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                aria-pressed={active}
                onClick={() => onCategoryChange(cat.id)}
                disabled={isSearchMode}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="news-country">
          地區
        </label>
        <select
          id="news-country"
          className={styles.select}
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          disabled={isSearchMode}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <footer className={styles.footer}>
        <p>資料來源：NewsAPI.org</p>
      </footer>
    </aside>
  );
}
