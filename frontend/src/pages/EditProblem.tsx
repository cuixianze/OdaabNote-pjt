import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { problemApi, subjectApi, tagApi } from '../api/client';
import type {
  ProblemChoiceDto,
  ProblemUpdateRequest,
  SubjectResponse,
  TagResponse,
  UnitResponse,
} from '../types/api';

/** 선지 키 (4개 기본, 수정 시 5개 이상 추가 가능) */
const CHOICE_KEYS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const defaultChoices: ProblemChoiceDto[] = CHOICE_KEYS.slice(0, 4).map((key) => ({ key, text: '' }));
const MAX_CHOICES = 10;

export function EditProblem() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
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
  const [deleting, setDeleting] = useState(false);
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

  const addChoice = () => {
    setForm((f) => {
      const current = f.choices ?? defaultChoices;
      if (current.length >= MAX_CHOICES) return f;
      const nextKey = CHOICE_KEYS[current.length] ?? `⑤+${current.length}`;
      return { ...f, choices: [...current, { key: nextKey, text: '' }] };
    });
  };

  const removeChoice = (index: number) => {
    setForm((f) => {
      const current = f.choices ?? defaultChoices;
      if (current.length <= 2) return f;
      return { ...f, choices: current.filter((_, i) => i !== index) };
    });
  };

  const handleDelete = async () => {
    if (!Number.isFinite(id) || !form.ownerUserId || form.ownerUserId < 1) {
      setError('소유자 ID를 확인해 주세요.');
      return;
    }
    if (!window.confirm('이 문제를 삭제할까요? 삭제 후에는 복구할 수 없습니다.')) return;
    setError(null);
    setDeleting(true);
    try {
      await problemApi.delete(id, form.ownerUserId);
      navigate('/problems', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-slate-600 dark:text-slate-300">로딩 중…</p>;
  if (!Number.isFinite(id)) return <p className="text-red-600 dark:text-red-400">잘못된 문제 ID입니다.</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/problems" className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white">← 문제 목록</Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">문제 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          본인(소유자)만 수정할 수 있습니다. 요청 시 소유자 ID가 일치해야 합니다.
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">소유자 사용자 ID (본인 확인용)</label>
          <input
            type="number"
            min={1}
            value={form.ownerUserId || ''}
            onChange={(e) => setForm((f) => ({ ...f, ownerUserId: Number(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">과목</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">선택</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">단원</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={!subjectId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">선택</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">문제 문장</label>
          <textarea
            value={form.questionText ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            rows={3}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">선지</label>
          <div className="space-y-2">
            {(form.choices ?? defaultChoices).map((c, i) => (
              <div key={`${i}-${c.key}`} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-slate-500 dark:text-slate-400">{c.key}</span>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeChoice(i)}
                  disabled={(form.choices ?? defaultChoices).length <= 2}
                  className="shrink-0 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                  title="선지 삭제"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addChoice}
            disabled={(form.choices ?? defaultChoices).length >= MAX_CHOICES}
            className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-600 dark:text-slate-300 dark:hover:bg-zinc-800"
          >
            + 선지 추가
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">정답 (예: ①)</label>
          <input
            type="text"
            value={form.correctChoiceKey ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, correctChoiceKey: e.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">해설</label>
          <textarea
            value={form.explanation ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
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

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving || deleting}
            className="rounded-lg bg-slate-800 px-6 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <Link to="/problems" className="rounded-lg border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
            취소
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="rounded-lg border border-red-300 bg-white px-6 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            {deleting ? '삭제 중…' : '문제 삭제'}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {saveSuccess && <p className="mt-4 text-sm text-green-600 dark:text-green-400">저장되었습니다.</p>}
    </div>
  );
}
