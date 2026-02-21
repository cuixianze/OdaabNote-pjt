import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-slate-800 transition hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
          >
            OdaabNote
          </Link>

          <div className="flex items-center gap-2">
          {/* PC: 가로 메뉴 */}
          <nav className="hidden items-center gap-1 md:flex md:text-sm md:font-medium md:text-slate-600 dark:text-slate-400">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              홈
            </Link>
            <Link
              to="/problems/new"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              문제 등록
            </Link>
            <Link
              to="/problems"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              문제 목록
            </Link>
            <Link
              to="/exams/random"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              시험 응시
            </Link>
            <Link
              to="/users"
              className="ml-2 rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              사용자
            </Link>
          </nav>

          {/* 다크 모드 토글 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={isDark ? '라이트 모드' : '다크 모드'}
          >
            {isDark ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* 모바일: 메뉴 버튼 */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-12 w-12 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-label="메뉴"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>

        {/* 모바일: 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:hidden">
            <nav className="flex flex-col py-2">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                홈
              </Link>
              <Link
                to="/problems/new"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                문제 등록
              </Link>
              <Link
                to="/problems"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                문제 목록
              </Link>
              <Link
                to="/exams/random"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                시험 응시
              </Link>
              <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
              <Link
                to="/users"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                사용자
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 dark:text-slate-200">
        <Outlet />
      </main>
    </div>
  );
}
