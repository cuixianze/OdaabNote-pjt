import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { problemApi, subjectApi, tagApi } from '../api/client';
import type { ProblemCreateRequest, SubjectResponse, TagResponse, UnitResponse } from '../types/api';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  subjectId: number | '';
  unitId: number | '';
  file: File | null;
  tagIds: number[];
}

export function CreateProblemSteps() {
  const [step, setStep] = useState<Step>(1);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [formData, setFormData] = useState<FormData>({
    subjectId: '',
    unitId: '',
    file: null,
    tagIds: [],
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<number | null>(null);
  const [createdTags, setCreatedTags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
    tagApi.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (formData.subjectId === '') {
      setUnits([]);
      setFormData((f) => ({ ...f, unitId: '' }));
      return;
    }
    subjectApi.getUnits(formData.subjectId).then(setUnits).catch(() => setUnits([]));
    setFormData((f) => ({ ...f, unitId: '' }));
  }, [formData.subjectId]);

  useEffect(() => {
    if (formData.file) {
      const url = URL.createObjectURL(formData.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.file]);

  const handleFileSelect = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setFormData((f) => ({ ...f, file }));
      setError(null);
    } else {
      setError('이미지 파일만 업로드할 수 있습니다.');
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const toggleTag = (tagId: number) => {
    setFormData((f) =>
      f.tagIds.includes(tagId)
        ? { ...f, tagIds: f.tagIds.filter((id) => id !== tagId) }
        : { ...f, tagIds: [...f.tagIds, tagId] }
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.subjectId === '' || formData.unitId === '') {
        setError('과목과 단원을 모두 선택하세요.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.file) {
        setError('이미지를 업로드하세요.');
        return;
      }
      setStep(3);
    }
    setError(null);
  };

  const handleBack = () => {
    if (step > 1 && step < 4) {
      setStep((s) => (s - 1) as Step);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.file || formData.subjectId === '' || formData.unitId === '') {
      setError('필수 항목을 모두 입력하세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep(4);

    try {
      const request: ProblemCreateRequest = {
        ownerUserId: 1,
        subjectId: formData.subjectId as number,
        unitId: formData.unitId as number,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
      };
      const res = await problemApi.create(request, formData.file);
      setResultId(res.id);
      setCreatedTags(res.tags ?? []);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 실패');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({ subjectId: '', unitId: '', file: null, tagIds: [] });
    setError(null);
    setResultId(null);
    setCreatedTags([]);
    setPreviewUrl(null);
  };

  const progressPercentage = step <= 3 ? ((step - 1) / 2) * 100 : step === 4 ? 90 : 100;

  return (
    <div className="min-h-screen bg-slate-50 pb-8 pt-4 dark:bg-black md:py-8">
      <div className="mx-auto max-w-md px-4">
        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              {step <= 3 ? `단계 ${step}/3` : step === 4 ? '처리 중...' : '완료'}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-slate-600 transition-all duration-300 ease-out dark:bg-slate-400"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {/* Step 1: 과목 및 단원 선택 */}
          {step === 1 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">과목 및 단원 선택</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    과목 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        subjectId: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">선택하세요</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    단원 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        unitId: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    disabled={!formData.subjectId}
                    className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base text-slate-800 transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:disabled:bg-zinc-900 dark:disabled:text-slate-500"
                  >
                    <option value="">선택하세요</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Link
                to="/problems/new/manual"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-zinc-600 dark:text-slate-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
              >
                수동입력
              </Link>
            </div>
          )}

          {/* Step 2: 이미지 업로드 */}
          {step === 2 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">문제 이미지 업로드</h2>
              {!previewUrl ? (
                <>
                  {/* 모바일: 카메라 및 갤러리 버튼 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="h-14 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                    >
                      📷 카메라
                    </button>
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="h-14 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                    >
                      🖼️ 갤러리
                    </button>
                  </div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {/* PC: 드래그 앤 드롭 영역 */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleGalleryClick}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                      isDragging
                        ? 'border-slate-500 bg-slate-100 dark:border-zinc-500 dark:bg-zinc-800'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-slate-300 dark:hover:border-zinc-500'
                    }`}
                  >
                    <p className="text-slate-600 dark:text-slate-300">이미지를 드래그하거나 클릭하여 업로드</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="미리보기"
                      className="w-full rounded-xl border-2 border-slate-200 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((f) => ({ ...f, file: null }));
                        setPreviewUrl(null);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-slate-800 p-2 text-white shadow-lg transition hover:bg-slate-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 태그 선택 및 최종 등록 (DB에 등록된 태그만 선택) */}
          {step === 3 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">태그 선택 (선택)</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">원하는 태그를 눌러 선택하세요.</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      formData.tagIds.includes(tag.id)
                        ? 'bg-slate-800 text-white dark:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-slate-500">등록된 태그가 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: 로딩 상태 */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8 transition-all duration-300">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600 dark:border-zinc-700 dark:border-t-white" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800 dark:text-white">AI가 문제를 분석하고 있어요...</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">잠시만 기다려주세요</p>
              </div>
            </div>
          )}

          {/* Step 5: 성공 상태 */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8 transition-all duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <span className="text-4xl">✅</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-white">문제가 성공적으로 등록되었습니다!</p>
                {resultId && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">문제 ID: {resultId}</p>
                )}
                {createdTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {createdTags.map((name) => (
                      <span
                        key={name}
                        className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-700 dark:text-slate-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-12 rounded-xl bg-slate-800 font-medium text-white transition hover:bg-slate-700 active:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  계속 문제 등록하기
                </button>
                <Link
                  to="/problems"
                  className="flex h-12 items-center justify-center rounded-xl border-2 border-slate-300 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                >
                  문제목록
                </Link>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          {/* 네비게이션 버튼 (Step 1-3만) */}
          {step <= 3 && (
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-12 flex-1 rounded-xl border-2 border-slate-300 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                >
                  이전
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && (formData.subjectId === '' || formData.unitId === '')) ||
                    (step === 2 && !formData.file)
                  }
                  className="h-12 flex-1 rounded-xl bg-slate-800 font-medium text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 dark:disabled:bg-zinc-700 dark:disabled:text-slate-500"
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.file || formData.subjectId === '' || formData.unitId === ''}
                  className="h-12 flex-1 rounded-xl bg-green-600 font-medium text-white transition hover:bg-green-700 active:bg-green-800 disabled:bg-slate-300 disabled:text-slate-500 dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-zinc-700 dark:disabled:text-slate-500"
                >
                  등록 완료
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
