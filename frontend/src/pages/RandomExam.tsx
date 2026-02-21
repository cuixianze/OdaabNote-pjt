import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi, subjectApi } from '../api/client';
import type { ExamResponse, SubjectResponse } from '../types/api';

type ExamMode = 'random' | 'subject' | 'full';

const EXAM_MODE_LABELS: Record<ExamMode, string> = {
  random: '과목 랜덤 N제',
  subject: '과목별 모의고사 (최대 20제)',
  full: '전체 모의고사 (20제 고정)',
};

export function RandomExam() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ExamMode>('subject');
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [count, setCount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let res: ExamResponse;
      if (mode === 'full') {
        res = await examApi.createFull({});
      } else if (mode === 'subject') {
        if (subjectId === '') {
          setError('과목을 선택하세요.');
          setLoading(false);
          return;
        }
        res = await examApi.createSubject({ subjectId });
      } else {
        if (subjectId === '') {
          setError('과목을 선택하세요.');
          setLoading(false);
          return;
        }
        res = await examApi.createRandom({ subjectId, count });
      }
      navigate(`/exams/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const needSubject = mode !== 'full';
  const canSubmit = !needSubject || subjectId !== '';

  return (
    <div className="min-h-screen bg-slate-50 pb-8 pt-4 dark:bg-slate-900 md:py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">시험 응시</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            과목 랜덤 N제, 과목별 모의고사(단원당 2~3문항·최대 20제), 전체 모의고사(20제 고정) 중 선택하세요.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* 모드 선택 */}
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.keys(EXAM_MODE_LABELS) as ExamMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`h-12 rounded-xl text-sm font-medium transition ${
                  mode === m
                    ? 'bg-slate-800 text-white shadow'
                    : 'border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {EXAM_MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {needSubject && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">과목</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
                  required={needSubject}
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
            )}
            {mode === 'random' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">문제 수</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                  className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="h-14 w-full rounded-xl bg-slate-800 text-lg font-semibold text-white shadow transition hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500"
            >
              {loading ? '준비 중…' : '시험 응시'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
