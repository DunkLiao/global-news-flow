import { Sidebar } from './components/Sidebar/Sidebar';
import { MainContent } from './components/MainContent/MainContent';
import { useNews } from './hooks/useNews';
import styles from './App.module.css';

function App() {
  const {
    keyword,
    setKeyword,
    category,
    setCategory,
    country,
    setCountry,
    page,
    setPage,
    articles,
    totalResults,
    pageSize,
    loading,
    error,
    refetch,
  } = useNews();

  const isSearchMode = Boolean(keyword.trim());

  return (
    <div className={styles.layout}>
      <Sidebar
        keyword={keyword}
        onKeywordChange={setKeyword}
        category={category}
        onCategoryChange={setCategory}
        country={country}
        onCountryChange={setCountry}
        isSearchMode={isSearchMode}
      />
      <MainContent
        category={category}
        keyword={keyword}
        articles={articles}
        totalResults={totalResults}
        loading={loading}
        error={error}
        page={page}
        onPageChange={setPage}
        onRetry={refetch}
        pageSize={pageSize}
      />
    </div>
  );
}

export default App;
