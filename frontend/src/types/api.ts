// User
export type UserRole = 'USER' | 'ADMIN';

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserCreateRequest {
  email: string;
  name: string;
  role?: UserRole;
}

// Subject / Unit
export interface SubjectResponse {
  id: number;
  name: string;
}

export interface UnitResponse {
  id: number;
  name: string;
  unitOrder: number;
}

// Problem
export interface ProblemChoiceDto {
  key: string;
  text: string;
}

export interface ChoiceExplanationDto {
  choice: string;
  explanation: string;
}

export interface ProblemResponse {
  id: number;
  ownerUserId: number | null;
  subjectId: number | null;
  unitId: number | null;
  questionText: string | null;
  imageUrl: string | null;
  ocrText: string | null;
  choices: ProblemChoiceDto[];
  correctChoiceKey: string | null;
  explanation: string | null;
  choiceExplanations?: ChoiceExplanationDto[];
  coreConcept?: string | null;
  keyConcepts?: string[];
  difficulty: number | null;
  source: string | null;
  tags: string[];
  tagIds: number[];
}

export interface ProblemCreateRequest {
  ownerUserId: number;
  /** 선택. 없으면 과목 미지정 */
  subjectId?: number | null;
  /** 선택. 없으면 단원 미지정 */
  unitId?: number | null;
  imageUrl?: string;
  ocrText?: string;
  questionText?: string;
  choices?: ProblemChoiceDto[];
  /** 선택. 없으면 서버에서 분석 또는 null */
  correctChoiceKey?: string | null;
  explanation?: string;
  difficulty?: number;
  source?: string;
  tagIds?: number[];
  /** 태그 이름 목록. 있으면 이름으로 찾거나 생성해 연결 (tagIds보다 우선) */
  tagNames?: string[];
}

export interface ProblemUpdateRequest {
  ownerUserId: number;
  subjectId: number;
  unitId: number;
  questionText?: string;
  choices?: ProblemChoiceDto[];
  correctChoiceKey?: string | null;
  explanation?: string | null;
  choiceExplanations?: ChoiceExplanationDto[] | null;
  coreConcept?: string | null;
  keyConcepts?: string[] | null;
  difficulty?: number | null;
  source?: string | null;
  tagIds?: number[];
  tagNames?: string[];
}

// Exam
export type ExamType = 'UNIT' | 'RANDOM' | 'CUSTOM' | 'SUBJECT' | 'FULL';

export interface ExamProblemSummary {
  problemId: number;
  questionNo: number;
}

export interface ExamResponse {
  id: number;
  title: string;
  type: ExamType;
  subjectId: number | null;
  unitId: number | null;
  questionCount: number;
  problems: ExamProblemSummary[];
}

export interface CreateRandomExamRequest {
  subjectId: number;
  createdByUserId?: number;
  count: number;
}

export interface CreateSubjectExamRequest {
  subjectId: number;
  createdByUserId?: number;
}

export interface CreateFullExamRequest {
  createdByUserId?: number;
}

// Tag
export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
}

export interface TagCreateRequest {
  name: string;
  color?: string;
}

// Comment
export interface CommentResponse {
  id: number;
  problemId: number;
  userId: number;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface CommentCreateRequest {
  userId: number;
  content: string;
}
