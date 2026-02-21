import { Link } from 'react-router-dom';

const features = [
  {
    to: '/problems',
    title: '문제 목록',
    description: '단원별·과목별로 문제를 보고 한 문제씩 넘기며 풀기',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    to: '/problems/new',
    title: '문제 등록',
    description: '과목·단원 선택 후 이미지 업로드 (수동입력 가능)',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    to: '/exams/random',
    title: '시험 응시',
    description: '과목 랜덤 N제, 과목별 모의고사(20제), 전체 모의고사(20제)',
    accent: 'from-rose-500 to-pink-600',
  },
  {
    to: '/users',
    title: '사용자',
    description: '사용자 생성·조회 및 이름 검색',
    accent: 'from-indigo-500 to-violet-600',
  },
];

export function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-8 py-12 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">OdaabNote</h1>
          <p className="mt-2 max-w-xl text-lg text-slate-200">
            문제를 모아두고, 단원·과목별로 복습하고, 랜덤 시험으로 실력을 확인하세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">문제 노트</span>
            <span className="rounded-full bg-white/10 px-3 py-1">OCR 자동 추출</span>
            <span className="rounded-full bg-white/10 px-3 py-1">과목별 시험</span>
            <span className="rounded-full bg-white/10 px-3 py-1">제미나이 분석</span>
            <span className="rounded-full bg-white/10 px-3 py-1">컴퓨터일반</span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-6 text-lg font-semibold text-slate-700 dark:text-slate-300">바로가기</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div
                className={`absolute top-0 right-0 h-20 w-20 rounded-bl-3xl bg-gradient-to-br ${f.accent} opacity-10 transition group-hover:opacity-20`}
              />
              <div className="relative">
                <h3 className="font-semibold text-slate-800 group-hover:text-slate-900 dark:text-slate-100 dark:group-hover:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
                <span className="mt-3 inline-block text-sm font-medium text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">
                  이동 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer hint */}
      <p className="mt-12 text-center text-sm text-slate-400 dark:text-slate-500">
        상단 메뉴에서 항목을 선택해 이용할 수 있습니다.
      </p>
    </div>
  );
}
