import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { examApi, problemApi } from '../api/client';
import { ProblemCard } from '../components/ProblemCard';
import type { ExamResponse, ProblemResponse } from '../types/api';

export function ExamDetail() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCommentRefresh] = useState(0);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    examApi
      .get(Number(examId))
      .then(async (examData) => {
        setExam(examData);
        if (!examData.problems?.length) {
          setProblems([]);
          return;
        }
        const list = await Promise.all(
          examData.problems.map((p) => problemApi.get(p.problemId))
        );
        setProblems(list);
        setCurrentIndex(0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (loading || !exam) return <p className="text-slate-600">로딩 중…</p>;

  const typeLabel =
    exam.type === 'SUBJECT' ? '과목별 모의고사' :
    exam.type === 'FULL' ? '전체 모의고사' :
    exam.type === 'RANDOM' ? '과목 랜덤' :
    exam.type === 'UNIT' ? '단원별' : exam.type;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-800">{exam.title}</h1>
      <p className="mb-6 text-slate-600">
        유형: {typeLabel} · 문제 수: {exam.questionCount}
      </p>

      {problems.length === 0 ? (
        <p className="text-slate-600">등록된 문제가 없습니다.</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              {currentIndex + 1} / {problems.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← 이전
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(problems.length - 1, i + 1))}
                disabled={currentIndex === problems.length - 1}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
