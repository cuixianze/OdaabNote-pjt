// S3 배포 시: VITE_API_BASE=http://43.200.170.32/api 로 빌드
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request<T>(
  path: string,
  options?: Omit<RequestInit, 'body'> & { body?: object }
): Promise<T> {
  const { body, ...rest } = options ?? {};
  const headers: HeadersInit = {
    ...(rest.headers as HeadersInit),
  };
  if (body !== undefined) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.statusText + (text ? ': ' + text : ''));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Users
export const userApi = {
  create: (data: import('../types/api').UserCreateRequest) =>
    request<import('../types/api').UserResponse>('/users', { method: 'POST', body: data }),
  get: (userId: number) =>
    request<import('../types/api').UserResponse>(`/users/${userId}`),
  /** 이름으로 검색 (비우면 전체). 사용자 ID 조회용 */
  list: (name?: string) =>
    request<import('../types/api').UserResponse[]>(
      name ? `/users?name=${encodeURIComponent(name)}` : '/users'
    ),
};

// Subjects / Units
export const subjectApi = {
  list: () =>
    request<import('../types/api').SubjectResponse[]>('/subjects'),
  getUnits: (subjectId: number) =>
    request<import('../types/api').UnitResponse[]>(`/subjects/${subjectId}/units`),
};

// Problems
export const problemApi = {
  create: (requestPart: import('../types/api').ProblemCreateRequest, file?: File) => {
    const form = new FormData();
    form.append('request', new Blob([JSON.stringify(requestPart)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return fetch(`${API_BASE}/problems`, { method: 'POST', body: form }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(res.statusText + (text ? ': ' + text : ''));
      }
      return res.json() as Promise<import('../types/api').ProblemResponse>;
    });
  },
  get: (problemId: number) =>
    request<import('../types/api').ProblemResponse>(`/problems/${problemId}`),
  update: (problemId: number, body: import('../types/api').ProblemUpdateRequest) =>
    request<import('../types/api').ProblemResponse>(`/problems/${problemId}`, {
      method: 'PUT',
      body,
    }),
  delete: (problemId: number, ownerUserId: number) =>
    request<void>(`/problems/${problemId}?ownerUserId=${encodeURIComponent(ownerUserId)}`, {
      method: 'DELETE',
    }),
  getByUnit: (unitId: number) =>
    request<import('../types/api').ProblemResponse[]>(`/units/${unitId}/problems`),
  getBySubject: (subjectId: number) =>
    request<import('../types/api').ProblemResponse[]>(`/subjects/${subjectId}/problems`),
  getByOwner: (userId: number) =>
    request<import('../types/api').ProblemResponse[]>(`/users/${userId}/problems`),
  getByTag: (tagId: number) =>
    request<import('../types/api').ProblemResponse[]>(`/problems?tagId=${tagId}`),
};

// Exams
export const examApi = {
  createRandom: (data: import('../types/api').CreateRandomExamRequest) =>
    request<import('../types/api').ExamResponse>('/exams/random', { method: 'POST', body: data }),
  /** 과목별 모의고사: 단원당 2~3문항, 최대 20제 */
  createSubject: (data: import('../types/api').CreateSubjectExamRequest) =>
    request<import('../types/api').ExamResponse>('/exams/subject', { method: 'POST', body: data }),
  /** 전체 모의고사: 과목당 2~3문항, 20제 고정 */
  createFull: (data: import('../types/api').CreateFullExamRequest) =>
    request<import('../types/api').ExamResponse>('/exams/full', { method: 'POST', body: data }),
  get: (examId: number) =>
    request<import('../types/api').ExamResponse>(`/exams/${examId}`),
};

// Tags
export const tagApi = {
  list: () =>
    request<import('../types/api').TagResponse[]>('/tags'),
  create: (data: import('../types/api').TagCreateRequest) =>
    request<import('../types/api').TagResponse>('/tags', { method: 'POST', body: data }),
  get: (tagId: number) =>
    request<import('../types/api').TagResponse>(`/tags/${tagId}`),
};

// Comments
export const commentApi = {
  list: (problemId: number) =>
    request<import('../types/api').CommentResponse[]>(`/problems/${problemId}/comments`),
  create: (problemId: number, data: import('../types/api').CommentCreateRequest) =>
    request<import('../types/api').CommentResponse>(`/problems/${problemId}/comments`, {
      method: 'POST',
      body: data,
    }),
};
