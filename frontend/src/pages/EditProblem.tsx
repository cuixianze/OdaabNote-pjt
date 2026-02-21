import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { problemApi, subjectApi, tagApi } from '../api/client';
import type {
  ProblemChoiceDto,
  ProblemUpdateRequest,
  SubjectResponse,
  TagResponse,
  UnitResponse,
} from '../types/api';

const defaultChoices: ProblemChoiceDto[] = [
  { key: '①', text: '' },
  { key: '②', text: '' },
  { key: '③', text: '' },
  { key: '④', text: '' },
];

export function EditProblem() {
  const { problemId } = useParams<{ problemId: string }>();
  const id = problemId ? Number(problemId) : NaN;

  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [unitId, setUnitId] = useState<number | ''>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [form, setForm] = useState<Omit<ProblemUpdateRequest, 'subjectId' | 'unitId' | 'tagIds'>>({
    ownerUserId: 0,
    questionText: '',
    choices: defaultChoices,
    correctChoiceKey: '①',
    explanation: '',
    choiceExplanations: undefined,
    coreConcept: '',
    keyConcepts: undefined,
    difficulty: undefined,
    source: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    problemApi
      .get(id)
      .then((p) => {
        setForm({
          ownerUserId: p.ownerUserId ?? 0,
          questionText: p.questionText ?? '',
          choices: p.choices?.length ? p.choices : defaultChoices,
          correctChoiceKey: p.correctChoiceKey ?? '①',
          explanation: p.explanation ?? '',
          choiceExplanations: p.choiceExplanations?.length ? p.choiceExplanations : undefined,
          coreConcept: p.coreConcept ?? '',
          keyConcepts: p.keyConcepts?.length ? p.keyConcepts : undefined,
          difficulty: p.difficulty ?? undefined,
          source: p.source ?? '',
        });
        setSubjectId(p.subjectId ?? '');
        setUnitId(p.unitId ?? '');
        setTagIds(p.tagIds ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
    tagApi.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (subjectId === '') {
      setUnits([]);
      return;
    }
    subjectApi.getUnits(subjectId).then(setUnits).catch(() => setUnits([]));
  }, [subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(id) || subjectId === '' || unitId === '') {
      setError('과목과 단원을 선택하세요.');
      return;
    }
    if (!form.ownerUserId || form.ownerUserId < 1) {
      setError('소유자 사용자 ID를 입력하세요(본인 확인용).');
      return;
    }
    const correctKey = (form.correctChoiceKey ?? '').trim();
    if (!correctKey) {
      setError('정답을 입력하세요.');
      return;
    }
    setError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const body: ProblemUpdateRequest = {
        ownerUserId: form.ownerUserId,
        subjectId,
        unitId,
        questionText: form.questionText ?? '',
        choices: form.choices?.length ? form.choices : defaultChoices,
        correctChoiceKey: correctKey,
        explanation: form.explanation || undefined,
        choiceExplanations: form.choiceExplanations?.length ? form.choiceExplanations : undefined,
        coreConcept: form.coreConcept || undefined,
        keyConcepts: form.keyConcepts?.length ? form.keyConcepts : undefined,
        difficulty: form.difficulty ?? undefined,
        source: form.source || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
      };
      await problemApi.update(id, body);
      setSaveSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const updateChoice = (index: number, text: string) => {
    setForm((f) => ({
      ...f,
      choices: (f.choices ?? defaultChoices).map((c, i) => (i === index ? { ...c, text } : c)),
    }));
  };

  if (loading) return <p className="text-slate-600">로딩 중…</p>;
  if (!Number.isFinite(id)) return <p className="text-red-600">잘못된 문제 ID입니다.</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/problems" className="text-slate-600 hover:text-slate-800">← 문제 목록</Link>
        <h1 className="text-2xl font-bold text-slate-800">문제 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800">
          본인(소유자)만 수정할 수 있습니다. 요청 시 소유자 ID가 일치해야 합니다.
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">소유자 사용자 ID (본인 확인용)</label>
          <input
            type="number"
            min={1}
            value={form.ownerUserId || ''}
            onChange={(e) => setForm((f) => ({ ...f, ownerUserId: Number(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">과목</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">선택</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">단원</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={!subjectId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
            >
              <option value="">선택</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">문제 문장</label>
          <textarea
            value={form.questionText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            rows={3}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">선지</label>
          <div className="space-y-2">
            {(form.choices ?? defaultChoices).map((c, i) => (
              <div key={c.key} className="flex items-center gap-2">
                <span className="w-6 text-slate-500">{c.key}</span>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">정답 (예: ①)</label>
          <input
            type="text"
            value={form.correctChoiceKey ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, correctChoiceKey: e.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">해설</label>
          <textarea
            value={form.explanation ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">태그</label>
          <p className="mb-2 text-xs text-slate-500">등록된 태그 중 선택하세요.</p>
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
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-800 px-6 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <Link to="/problems" className="rounded-lg border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-100">
            취소
          </Link>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saveSuccess && <p className="mt-4 text-sm text-green-600">저장되었습니다.</p>}
    </div>
  );
}
