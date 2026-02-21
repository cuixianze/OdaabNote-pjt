import { useEffect, useState } from 'react';
import { problemApi, subjectApi, tagApi } from '../api/client';
import { ProblemCard } from '../components/ProblemCard';
import type { ProblemResponse, SubjectResponse, TagResponse, UnitResponse } from '../types/api';

type ProblemListMode = 'unit' | 'subject' | 'tag';
type Step = 1 | 2;

export function ProblemsByUnit() {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<ProblemListMode>('unit');
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [unitId, setUnitId] = useState<number | ''>('');
  const [tagId, setTagId] = useState<number | ''>('');
  const [tagSearch, setTagSearch] = useState('');
  const [problems, setProblems] = useState<ProblemResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCommentRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
    tagApi.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (subjectId === '') {
      setUnits([]);
      setUnitId('');
      return;
    }
    subjectApi.getUnits(subjectId).then(setUnits).catch(() => setUnits([]));
    setUnitId('');
  }, [subjectId]);

  const loadProblems = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let list: ProblemResponse[] = [];
      if (mode === 'tag') {
        list = tagId !== '' ? await problemApi.getByTag(tagId) : [];
      } else if (mode === 'subject') {
        list = subjectId !== '' ? await problemApi.getBySubject(subjectId) : [];
      } else {
        list = unitId !== '' ? await problemApi.getByUnit(unitId) : [];
      }
      setProblems([...list].reverse());
      setCurrentIndex(0);
      setViewMode('list');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setProblems(null);
    } finally {
      setLoading(false);
    }
  };

  const canLoad =
    mode === 'tag' ? tagId !== '' : mode === 'subject' ? subjectId !== '' : unitId !== '';

  const filteredTags = tagSearch.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(tagSearch.trim().toLowerCase()))
    : tags;

  const handleBackToFilter = () => {
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8 pt-4 md:py-8">
      <div className="mx-auto max-w-md px-4">
        {/* Step 1: 필터 선택 및 문제 불러오기 */}
        {step === 1 && (
          <div className="space-y-6 transition-all duration-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">문제 목록</h1>
              <p className="mt-2 text-slate-600">
                단원별, 과목별, 태그별로 검색한 뒤 문제를 불러오세요.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">검색 조건</h2>

              {/* 모드 선택: 단원별 / 과목별 / 태그별 */}
              <div className="mb-6 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('unit')}
                  className={`h-12 rounded-xl text-sm font-medium transition ${
                    mode === 'unit'
                      ? 'bg-slate-800 text-white shadow'
                      : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  단원별
                </button>
                <button
                  type="button"
                  onClick={() => setMode('subject')}
                  className={`h-12 rounded-xl text-sm font-medium transition ${
                    mode === 'subject'
                      ? 'bg-slate-800 text-white shadow'
                      : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  과목별
                </button>
                <button
                  type="button"
                  onClick={() => setMode('tag')}
                  className={`h-12 rounded-xl text-sm font-medium transition ${
                    mode === 'tag'
                      ? 'bg-slate-800 text-white shadow'
                      : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  태그별
                </button>
              </div>

              <form onSubmit={loadProblems} className="space-y-4">
                {mode === 'tag' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">태그 검색</label>
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="태그 이름으로 검색"
                        className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">태그 선택</label>
                      <select
                        value={tagId}
                        onChange={(e) => setTagId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">선택하세요</option>
                        {filteredTags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">과목</label>
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">선택하세요</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mode === 'unit' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">단원</label>
                        <select
                          value={unitId}
                          onChange={(e) => setUnitId(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!subjectId}
                          className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="">선택하세요</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canLoad || loading}
                  className="h-14 w-full rounded-xl bg-slate-800 text-lg font-semibold text-white shadow transition hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {loading ? '불러오는 중…' : '문제 불러오기'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: 문제 목록만 표시 */}
        {step === 2 && problems && (
          <div className="space-y-4 transition-all duration-300">
            {/* 상단: 다시 검색 + 보기 모드 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleBackToFilter}
                className="h-12 rounded-xl border-2 border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
              >
                ← 다시 검색
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">총 {problems.length}개</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`h-10 rounded-lg px-4 text-sm font-medium transition ${
                      viewMode === 'list'
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    목록
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('single')}
                    className={`h-10 rounded-lg px-4 text-sm font-medium transition ${
                      viewMode === 'single'
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    한 문제씩
                  </button>
                </div>
              </div>
            </div>

            {problems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                등록된 문제가 없습니다.
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {problems.map((p) => (
                  <ProblemCard
                    key={p.id}
                    problem={p}
                    onCommentAdded={() => setCommentRefresh((n) => n + 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {currentIndex + 1} / {problems.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="h-12 rounded-xl border-2 border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ← 이전
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => Math.min(problems.length - 1, i + 1))}
                      disabled={currentIndex === problems.length - 1}
                      className="h-12 rounded-xl bg-slate-800 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      다음 →
                    </button>
                  </div>
                </div>
                <ProblemCard
                  key={problems[currentIndex].id}
                  problem={problems[currentIndex]}
                  onCommentAdded={() => setCommentRefresh((n) => n + 1)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
