import { useEffect, useState } from 'react';
import { problemApi, subjectApi } from '../api/client';
import type { ProblemChoiceDto, ProblemCreateRequest, SubjectResponse, UnitResponse } from '../types/api';

const defaultChoices: ProblemChoiceDto[] = [
  { key: '①', text: '' },
  { key: '②', text: '' },
  { key: '③', text: '' },
  { key: '④', text: '' },
];

function parseTagNames(input: string): string[] {
  return input
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  const [tagNamesInput, setTagNamesInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
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
      const tagNames = parseTagNames(tagNamesInput);
      const request: ProblemCreateRequest = file
        ? {
            ownerUserId: form.ownerUserId,
            subjectId,
            unitId,
            correctChoiceKey: correctKey ?? undefined,
            tagNames: tagNames.length ? tagNames : undefined,
          }
        : {
            ...form,
            subjectId,
            unitId,
            correctChoiceKey: correctKey ?? undefined,
            choices: form.choices?.length ? form.choices : undefined,
            tagNames: tagNames.length ? tagNames : undefined,
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
      <h1 className="mb-6 text-2xl font-bold text-slate-800">문제 등록</h1>
      <p className="mb-6 text-slate-600">
        이미지를 첨부하면 서버에서 OCR로 문장·선지를 자동 채웁니다(과목·단원·소유자 ID만 보냅니다). 이미지 없이 등록할 때는 아래 문장·선지를 직접 입력하세요.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">과목 <span className="text-red-500">*</span></label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">선택</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">단원 <span className="text-red-500">*</span></label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={!subjectId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            >
              <option value="">선택</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">소유자 사용자 ID</label>
          <input
            type="number"
            min={1}
            value={form.ownerUserId}
            onChange={(e) => setForm((f) => ({ ...f, ownerUserId: Number(e.target.value) || 1 }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">태그</label>
          <input
            type="text"
            value={tagNamesInput}
            onChange={(e) => setTagNamesInput(e.target.value)}
            placeholder="본인 이름, 난이도상, 중요 (쉼표로 구분)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <p className="mt-0.5 text-xs text-slate-500">첫 번째는 본인 이름을 입력하세요. 사용자별로 찾을 때 활용됩니다. 필요하면 난이도 등 추가 입력.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">문제 이미지 (선택)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">문제 문장 (이미지 없을 때 필수)</label>
          <textarea
            value={form.questionText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">선지 (이미지 없을 때 입력)</label>
          <div className="space-y-2">
            {(form.choices ?? defaultChoices).map((c, i) => (
              <div key={c.key} className="flex items-center gap-2">
                <span className="w-6 text-slate-500">{c.key}</span>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">정답 (선택, 예: ①, ②, ③, ④)</label>
          <input
            type="text"
            value={form.correctChoiceKey ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, correctChoiceKey: e.target.value }))}
            placeholder="비우면 서버에서 분석"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {/* 등록 버튼: 가운데 크게, 등록 → 등록 중(로딩바) → 등록 완료(문제 ID) */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {!loading && !result && (
            <button
              type="submit"
              className="min-w-[200px] rounded-2xl bg-slate-800 px-12 py-4 text-xl font-semibold text-white shadow-lg transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              등록
            </button>
          )}
          {loading && (
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-8 py-6">
              <p className="text-lg font-semibold text-slate-700">등록 중</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full min-w-[30%] rounded-full bg-slate-500"
                  style={{ animation: 'createProblemLoadingBar 1.2s ease-in-out infinite' }}
                />
              </div>
            </div>
          )}
          {result && !loading && (
            <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 px-8 py-6">
              <p className="text-lg font-semibold text-green-800">등록 완료</p>
              <p className="text-slate-600">문제 ID: <span className="font-bold text-green-800">{result.id}</span></p>
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

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
