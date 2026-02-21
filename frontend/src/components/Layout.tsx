import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-slate-800 transition hover:text-slate-600"
          >
            OdaabNote
          </Link>

          {/* PC: 가로 메뉴 */}
          <nav className="hidden items-center gap-1 md:flex md:text-sm md:font-medium md:text-slate-600">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              홈
            </Link>
            <Link
              to="/problems/new"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              문제 등록
            </Link>
            <Link
              to="/problems"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              문제 목록
            </Link>
            <Link
              to="/exams/random"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              시험 응시
            </Link>
            <Link
              to="/users"
              className="ml-2 rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              사용자
            </Link>
          </nav>

          {/* 모바일: 메뉴 버튼 */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-12 w-12 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
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

        {/* 모바일: 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <nav className="flex flex-col py-2">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50"
              >
                홈
              </Link>
              <Link
                to="/problems/new"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50"
              >
                문제 등록
              </Link>
              <Link
                to="/problems"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50"
              >
                문제 목록
              </Link>
              <Link
                to="/exams/random"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-700 transition hover:bg-slate-50"
              >
                시험 응시
              </Link>
              <div className="my-2 border-t border-slate-100" />
              <Link
                to="/users"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-slate-500 transition hover:bg-slate-50"
              >
                사용자
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
