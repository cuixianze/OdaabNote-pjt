import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { problemApi, subjectApi } from '../api/client';
import type { ProblemCreateRequest, SubjectResponse, UnitResponse } from '../types/api';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  subjectId: number | '';
  unitId: number | '';
  file: File | null;
  tags: string[];
}

export function CreateProblemSteps() {
  const [step, setStep] = useState<Step>(1);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [formData, setFormData] = useState<FormData>({
    subjectId: '',
    unitId: '',
    file: null,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    subjectApi.list().then(setSubjects).catch(() => setSubjects([]));
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

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((f) => ({ ...f, tags: [...f.tags, trimmed] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((f) => ({ ...f, tags: f.tags.filter((t) => t !== tagToRemove) }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
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
        tagNames: formData.tags.length > 0 ? formData.tags : undefined,
      };
      const res = await problemApi.create(request, formData.file);
      setResultId(res.id);
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
    setFormData({ subjectId: '', unitId: '', file: null, tags: [] });
    setTagInput('');
    setError(null);
    setResultId(null);
    setPreviewUrl(null);
  };

  const progressPercentage = step <= 3 ? ((step - 1) / 2) * 100 : step === 4 ? 90 : 100;

  return (
    <div className="min-h-screen bg-slate-50 pb-8 pt-4 md:py-8">
      <div className="mx-auto max-w-md px-4">
        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
            <span>
              {step <= 3 ? `단계 ${step}/3` : step === 4 ? '처리 중...' : '완료'}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Step 1: 과목 및 단원 선택 */}
          {step === 1 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800">과목 및 단원 선택</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
              </div>
              <Link
                to="/problems/new/manual"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
              >
                수동입력
              </Link>
            </div>
          )}

          {/* Step 2: 이미지 업로드 */}
          {step === 2 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800">문제 이미지 업로드</h2>
              {!previewUrl ? (
                <>
                  {/* 모바일: 카메라 및 갤러리 버튼 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="h-14 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
                    >
                      📷 카메라
                    </button>
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="h-14 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
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
                        ? 'border-slate-500 bg-slate-100'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-slate-600">이미지를 드래그하거나 클릭하여 업로드</p>
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

          {/* Step 3: 태그 입력 및 최종 등록 */}
          {step === 3 && (
            <div className="space-y-6 transition-all duration-300">
              <h2 className="text-xl font-bold text-slate-800">태그 입력 (선택)</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="이름이나 난이도, 메모남기고싶은단어 입력"
                    className="h-12 flex-1 rounded-xl border-2 border-slate-300 px-4 text-base text-slate-800 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="h-12 rounded-xl bg-slate-200 px-4 font-medium text-slate-700 transition hover:bg-slate-300 active:bg-slate-400"
                  >
                    추가
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: 로딩 상태 */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8 transition-all duration-300">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">AI가 문제를 분석하고 있어요...</p>
                <p className="mt-2 text-sm text-slate-600">잠시만 기다려주세요</p>
              </div>
            </div>
          )}

          {/* Step 5: 성공 상태 */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8 transition-all duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <span className="text-4xl">✅</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-800">문제가 성공적으로 등록되었습니다!</p>
                {resultId && (
                  <p className="mt-2 text-sm text-slate-600">문제 ID: {resultId}</p>
                )}
              </div>
              <div className="mt-4 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-12 rounded-xl bg-slate-800 font-medium text-white transition hover:bg-slate-700 active:bg-slate-900"
                >
                  계속 문제 등록하기
                </button>
                <Link
                  to="/problems"
                  className="flex h-12 items-center justify-center rounded-xl border-2 border-slate-300 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
                >
                  문제목록
                </Link>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
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
                  className="h-12 flex-1 rounded-xl border-2 border-slate-300 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
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
                  className="h-12 flex-1 rounded-xl bg-slate-800 font-medium text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.file || formData.subjectId === '' || formData.unitId === ''}
                  className="h-12 flex-1 rounded-xl bg-green-600 font-medium text-white transition hover:bg-green-700 active:bg-green-800 disabled:bg-slate-300 disabled:text-slate-500"
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
