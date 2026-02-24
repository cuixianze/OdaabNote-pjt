import { useEffect, useState } from 'react';
import { problemApi, subjectApi, tagApi } from '../api/client';
import type { ProblemChoiceDto, ProblemCreateRequest, SubjectResponse, TagResponse, UnitResponse } from '../types/api';

const defaultChoices: ProblemChoiceDto[] = [
  { key: '①', text: '' },
  { key: '②', text: '' },
  { key: '③', text: '' },
  { key: '④', text: '' },
];

export function CreateProblem() {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [unitId, setUnitId] = useState<number | ''>('');
  const [form, setForm] = useState<Omit<ProblemCreateRequest, 'subjectId' | 'unitId'>>({
    ownerUserId: 1,
    questionText: '',
    choices: defaultChoices,
    correctChoiceKey: '',
    explanation: '',
    difficulty: undefined,
    source: '',
  });
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectId === '' || unitId === '') {
      setError('과목과 단원을 선택하세요.');
      return;
    }
    if (!file && !(form.questionText?.trim())) {
      setError('이미지를 첨부하거나 문제 문장을 입력하세요.');
      return;
    }
    const correctKey = (form.correctChoiceKey ?? '').trim() || undefined;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const request: ProblemCreateRequest = file
        ? {
            ownerUserId: form.ownerUserId,
            subjectId,
            unitId,
            correctChoiceKey: correctKey ?? undefined,
            tagIds: tagIds.length ? tagIds : undefined,
          }
        : {
            ...form,
            subjectId,
            unitId,
            correctChoiceKey: correctKey ?? undefined,
            choices: form.choices?.length ? form.choices : undefined,
            tagIds: tagIds.length ? tagIds : undefined,
          };
      const res = await problemApi.create(request, file ?? undefined);
      setResult({ id: res.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const updateChoice = (index: number, text: string) => {
    setForm((f) => ({
      ...f,
      choices: (f.choices ?? defaultChoices).map((c, i) => (i === index ? { ...c, text } : c)),
    }));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-white">문제 등록</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-300">
        이미지를 첨부하면 서버에서 OCR로 문장·선지를 자동 채웁니다(과목·단원·소유자 ID만 보냅니다). 이미지 없이 등록할 때는 아래 문장·선지를 직접 입력하세요.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">과목 <span className="text-red-500">*</span></label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">선택</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">단원 <span className="text-red-500">*</span></label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={!subjectId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">선택</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">소유자 사용자 ID</label>
          <input
            type="number"
            min={1}
            value={form.ownerUserId}
            onChange={(e) => setForm((f) => ({ ...f, ownerUserId: Number(e.target.value) || 1 }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">태그</label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">등록된 태그 중 선택하세요.</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setTagIds((prev) =>
                    prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  )
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  tagIds.includes(tag.id)
                    ? 'bg-slate-800 text-white dark:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">문제 이미지 (선택)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">문제 문장 (이미지 없을 때 필수)</label>
          <textarea
            value={form.questionText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">선지 (이미지 없을 때 입력)</label>
          <div className="space-y-2">
            {(form.choices ?? defaultChoices).map((c, i) => (
              <div key={c.key} className="flex items-center gap-2">
                <span className="w-6 text-slate-500 dark:text-slate-400">{c.key}</span>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">정답 (선택, 예: ①, ②, ③, ④)</label>
          <input
            type="text"
            value={form.correctChoiceKey ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, correctChoiceKey: e.target.value }))}
            placeholder="비우면 서버에서 분석"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* 등록 버튼: 가운데 크게, 등록 → 등록 중(로딩바) → 등록 완료(문제 ID) */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {!loading && !result && (
            <button
              type="submit"
              className="min-w-[200px] rounded-2xl bg-slate-800 px-12 py-4 text-xl font-semibold text-white shadow-lg transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              등록
            </button>
          )}
          {loading && (
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-8 py-6 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-lg font-semibold text-slate-700 dark:text-white">등록 중</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                <div
                  className="h-full min-w-[30%] rounded-full bg-slate-500 dark:bg-slate-400"
                  style={{ animation: 'createProblemLoadingBar 1.2s ease-in-out infinite' }}
                />
              </div>
            </div>
          )}
          {result && !loading && (
            <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 px-8 py-6 dark:border-green-800 dark:bg-green-950/40">
              <p className="text-lg font-semibold text-green-800 dark:text-green-400">등록 완료</p>
              <p className="text-slate-600 dark:text-slate-300">문제 ID: <span className="font-bold text-green-800 dark:text-green-400">{result.id}</span></p>
            </div>
          )}
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes createProblemLoadingBar {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(250%); }
        }
      `}}></style>

      {error && <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
