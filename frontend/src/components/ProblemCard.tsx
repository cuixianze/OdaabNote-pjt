import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commentApi } from '../api/client';
import type { CommentResponse, ProblemResponse } from '../types/api';

export function ProblemCard({
  problem,
  onCommentAdded,
}: {
  problem: ProblemResponse;
  onCommentAdded: () => void;
}) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showWrongExplanations, setShowWrongExplanations] = useState(false);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentUserId, setCommentUserId] = useState(1);
  const [commentContent, setCommentContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const correctKey = problem.correctChoiceKey?.trim() || null;
  const isCorrect = correctKey != null && selectedChoice != null && selectedChoice.trim() === correctKey;
  const hasAnswered = selectedChoice != null;
  const hasKeyReflexes = (problem.keyConcepts?.length ?? 0) > 0;
  const hasExplanation = !!(
    problem.explanation?.trim() ||
    (problem.choiceExplanations?.length) ||
    problem.coreConcept?.trim() ||
    hasKeyReflexes
  );

  /** "개념명: 키워드1, 키워드2, ..." → { concept, keywords } */
  const parseKeyConcept = (s: string): { concept: string; keywords: string[] } => {
    const i = s.indexOf(': ');
    if (i < 0) return { concept: s.trim(), keywords: [] };
    const concept = s.slice(0, i).trim();
    const rest = s.slice(i + 2).trim();
    const keywords = rest ? rest.split(',').map((k) => k.trim()).filter(Boolean) : [];
    return { concept, keywords };
  };

  useEffect(() => {
    if (!open) return;
    setLoadingComments(true);
    commentApi
      .list(problem.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [open, problem.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || commentUserId < 1) {
      setSubmitError('사용자 ID는 1 이상, 내용을 입력하세요.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await commentApi.create(problem.id, { userId: commentUserId, content: commentContent.trim() });
      setCommentContent('');
      const list = await commentApi.list(problem.id);
      setComments(list);
      onCommentAdded();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '댓글 등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const choiceStyle = (key: string) => {
    if (!hasAnswered) return '';
    const k = key.trim();
    if (k === correctKey) return 'ring-2 ring-green-500 bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
    if (selectedChoice?.trim() === k && k !== correctKey) return 'ring-2 ring-red-400 bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
    return 'bg-slate-50/50 border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-600 dark:text-white';
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">#{problem.id}</span>
        {problem.tags?.length ? (
          <span className="flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-700 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-slate-700 dark:text-white">{problem.questionText ?? '(문제 없음)'}</p>

      {/* 선지: 퀴즈형 클릭 */}
      {problem.choices?.length ? (
        <div className="mt-3 space-y-2">
          {problem.choices.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={hasAnswered}
              onClick={() => !hasAnswered && setSelectedChoice(c.key)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${choiceStyle(c.key)} ${!hasAnswered ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-500' : 'cursor-default'}`}
            >
              <span className="text-slate-500 dark:text-slate-400">{c.key}</span> <span className="dark:text-white">{c.text}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* 선택 후 정답/오답 표시 */}
      {hasAnswered && correctKey != null && (
        <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
          {isCorrect ? '정답!' : '오답'}
        </div>
      )}

      {/* 해설/핵심개념 보기 버튼 → 클릭 시 표시 */}
      {hasAnswered && hasExplanation && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setShowExplanation((v) => !v);
              if (showExplanation) setShowWrongExplanations(false);
            }}
            className="rounded-lg bg-slate-200/80 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
          >
            {showExplanation
              ? '해설 · 키워드 반사신경 접기'
              : hasKeyReflexes
                ? '해설 · 키워드 반사신경 보기'
                : '해설 / 핵심개념 보기'}
          </button>
          {showExplanation && (
            <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
              {/* 1. 정답 선지 해설 (또는 전체 해설) */}
              {problem.choiceExplanations?.length
                ? correctKey
                  ? problem.choiceExplanations
                      .filter((e) => (e.choice?.trim() || '') === correctKey)
                      .map((e, i) => (
                        <div key={i} className="rounded-lg border-2 border-green-200 bg-green-50/80 p-3 dark:border-green-700 dark:bg-green-900/30">
                          <span className="mb-1.5 block text-sm font-semibold text-green-800 dark:text-green-200">
                            {e.choice}. 정답 해설
                          </span>
                          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{e.explanation}</p>
                        </div>
                      ))
                  : problem.choiceExplanations.map((e, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-800">
                        <span className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {e.choice}. 선지 해설
                        </span>
                        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{e.explanation}</p>
                      </div>
                    ))
                : problem.explanation?.trim()
                  ? problem.explanation.split(/\n\n+/).map((para, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-800">
                        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{para}</p>
                      </div>
                    ))
                  : null}

              {/* 2. 키워드 반사신경 / 핵심개념 */}
              {hasKeyReflexes && problem.keyConcepts && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      키워드 반사신경
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">1초 복습용 · 핵심 vs 라이벌 개념</p>
                  </div>
                  <div className="space-y-2.5">
                    {problem.keyConcepts.map((item, idx) => {
                      const { concept, keywords } = parseKeyConcept(item);
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3.5 ${
                            isFirst
                              ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-700 dark:bg-emerald-900/40'
                              : 'border-slate-200 bg-white dark:border-zinc-600 dark:bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`mb-2 block text-sm font-semibold ${
                              isFirst ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isFirst && (
                              <span className="mr-1.5 rounded bg-emerald-200/80 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                                핵심
                              </span>
                            )}
                            {concept}
                          </span>
                          {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {keywords.map((kw, ki) => (
                                <span
                                  key={ki}
                                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                    isFirst
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200'
                                      : 'bg-slate-100 text-slate-700 dark:bg-zinc-700 dark:text-slate-200'
                                  }`}
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* (keyConcepts 없을 때) 기존 coreConcept 텍스트 표시 */}
              {!hasKeyReflexes && problem.coreConcept?.trim() && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/90 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    핵심 개념
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                    {problem.coreConcept}
                  </p>
                </div>
              )}

              {/* 3. 오답 선지 해설 (버튼으로만 표시) */}
              {problem.choiceExplanations?.length &&
                correctKey &&
                problem.choiceExplanations.filter((e) => (e.choice?.trim() || '') !== correctKey).length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowWrongExplanations((v) => !v)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700"
                    >
                      {showWrongExplanations ? '오답 해설 접기' : '오답 해설 보기'}
                    </button>
                    {showWrongExplanations &&
                      problem.choiceExplanations
                        .filter((e) => (e.choice?.trim() || '') !== correctKey)
                        .map((e, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-600">
                              {e.choice}. 선지 해설
                            </span>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{e.explanation}</p>
                          </div>
                        ))}
                  </>
                )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-zinc-700">
        <Link
          to={`/problems/${problem.id}/edit`}
          className="text-sm font-medium text-slate-600 underline hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
        >
          수정
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
        >
          댓글 {open ? '접기' : '보기/쓰기'}
        </button>
        {open && (
          <div className="mt-3 space-y-3">
            {loadingComments ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">로딩 중…</p>
            ) : (
              <ul className="space-y-2">
                {comments.length === 0 ? (
                  <li className="text-sm text-slate-500 dark:text-slate-400">댓글이 없습니다.</li>
                ) : (
                  comments.map((c) => (
                    <li key={c.id} className="rounded-lg bg-slate-50 p-2 text-sm dark:bg-zinc-800">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{c.userName}</span>
                      <span className="text-slate-500 dark:text-slate-400"> ({c.userEmail})</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200">{c.content}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{c.createdAt}</p>
                    </li>
                  ))
                )}
              </ul>
            )}
            <form onSubmit={handleAddComment} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">사용자 ID</label>
                <input
                  type="number"
                  min={1}
                  value={commentUserId}
                  onChange={(e) => setCommentUserId(Number(e.target.value) || 1)}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">댓글</label>
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글 입력"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
              >
                {submitting ? '등록 중…' : '등록'}
              </button>
            </form>
            {submitError && <p className="text-xs text-red-600">{submitError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
