const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('harang_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    
    // 성공 응답 (2xx)
    if (res.ok) {
      if (res.status === 204) return undefined as T
      return res.json()
    }

    // 에러 응답 처리
    let errorData: any
    try {
      errorData = await res.json()
    } catch {
      // JSON 파싱 실패 시 기본 메시지
      throw new ApiError(res.status, res.statusText)
    }

    // 백엔드 에러 응답 구조에 따라 처리
    const errorMessage = errorData.error || errorData.message || errorData.detail || '요청 실패'
    const errorDetails = errorData.details || errorData.errors

    throw new ApiError(res.status, errorMessage, errorDetails)
    
  } catch (error) {
    // 네트워크 에러 또는 이미 ApiError인 경우
    if (error instanceof ApiError) {
      throw error
    }
    
    // 네트워크 에러 (서버 연결 불가 등)
    throw new ApiError(0, '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.')
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  signup: (data: {
    username: string
    password: string
    name: string
    role: 'student' | 'teacher'
    grade?: number
    class_num?: number
    number?: number
    subject?: string
    teacher_code?: string
    homeroom_grade?: number
    homeroom_class_num?: number
    phone?: string
    email?: string
  }) =>
    request<UserOut>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<UserOut>("/api/auth/me"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => request<UserOut[]>('/api/users/'),
  get: (id: number) => request<UserOut>(`/api/users/${id}`),
  updateMe: (data: { phone?: string; email?: string; bio?: string }) =>
    request<UserOut>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getRooms: () => request<RoomOut[]>('/api/chat/rooms'),
  createRoom: (data: {
    kind: string
    name: string
    emoji?: string
    description?: string
    is_teacher_only?: boolean
    member_ids?: number[]
  }) => request<RoomOut>('/api/chat/rooms', { method: 'POST', body: JSON.stringify(data) }),
  deleteRoom: (id: number) =>
    request<void>(`/api/chat/rooms/${id}`, { method: 'DELETE' }),
  getMessages: (roomId: number) =>
    request<MessageOut[]>(`/api/chat/rooms/${roomId}/messages`),
  sendMessage: (roomId: number, content: string) =>
    request<MessageOut>(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  react: (messageId: number, emoji: string) =>
    request<void>(`/api/chat/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
}

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementsApi = {
  list: () => request<AnnouncementOut[]>('/api/announcements/'),
  create: (data: {
    title: string
    content: string
    category?: string
    is_pinned?: boolean
    is_urgent?: boolean
  }) =>
    request<AnnouncementOut>('/api/announcements/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markRead: (id: number) =>
    request<void>(`/api/announcements/${id}/read`, { method: 'POST' }),
  delete: (id: number) =>
    request<void>(`/api/announcements/${id}`, { method: 'DELETE' }),
}

// ── Assignments ───────────────────────────────────────────────────────────────
export const assignmentsApi = {
  list: () => request<AssignmentOut[]>('/api/assignments/'),
  create: (data: {
    title: string
    description?: string
    subject: string
    due_date: string
    max_score?: number
  }) =>
    request<AssignmentOut>('/api/assignments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submit: (assignmentId: number, data: { content?: string; file_name?: string }) =>
    request<SubmissionOut>(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSubmissions: (assignmentId: number) =>
    request<SubmissionOut[]>(`/api/assignments/${assignmentId}/submissions`),
}

// ── Grades ────────────────────────────────────────────────────────────────────
export const gradesApi = {
  mine: () => request<GradeOut[]>('/api/grades/'),
  student: (id: number) => request<GradeOut[]>(`/api/grades/student/${id}`),
}

// ── Schedule ──────────────────────────────────────────────────────────────────
export const scheduleApi = {
  timetable: (grade?: number, classNum?: number) => {
    const params = new URLSearchParams();
    if (grade) params.set("grade", String(grade));
    if (classNum) params.set("class_num", String(classNum));
    return request<ScheduleItem[]>(`/api/schedule/timetable?${params}`);
  },
  events: () => request<EventOut[]>("/api/schedule/events"),
  upsertTimetable: (data: {
    grade: number;
    class_num: number;
    day: string;
    period: number;
    subject: string;
    teacher?: string;
    room?: string;
  }) =>
    request<ScheduleItem>("/api/schedule/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTimetable: (id: number) =>
    request<void>(`/api/schedule/timetable/${id}`, { method: "DELETE" }),
};

// ── QnA ───────────────────────────────────────────────────────────────────────
export const qnaApi = {
  list: (subject?: string) => {
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : ''
    return request<QnAPostOut[]>(`/api/qna/${params}`)
  },
  create: (data: { title: string; content: string; subject: string }) =>
    request<QnAPostOut>('/api/qna/', { method: 'POST', body: JSON.stringify(data) }),
  answer: (postId: number, content: string) =>
    request<QnAAnswerOut>(`/api/qna/${postId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  like: (postId: number) =>
    request<{ likes: number }>(`/api/qna/${postId}/like`, { method: 'POST' }),
  acceptAnswer: (answerId: number) =>
    request<void>(`/api/qna/answers/${answerId}/accept`, { method: 'PATCH' }),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request<NotificationOut[]>('/api/notifications/'),
  markRead: (id: number) =>
    request<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    request<void>('/api/notifications/read-all', { method: 'POST' }),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UserOut {
  id: number;
  username: string;
  name: string;
  role: "student" | "teacher";
  grade?: number;
  class_num?: number;
  number?: number;
  subject?: string;
  avatar_text: string;
  avatar_color: string;
  bio?: string;
  phone?: string;
  email?: string;
  homeroom_grade?: number;
  homeroom_class_num?: number;
}

export interface RoomOut {
  id: number
  kind: 'class_notice' | 'class_free' | 'class_question' | 'group' | 'dm'
  name: string
  emoji: string
  description?: string
  is_teacher_only: boolean
  created_by: number
  member_ids: number[]
  last_message?: string
  last_time?: string
  unread: number
}

export interface MessageOut {
  id: number
  room_id: number
  user_id: number
  user_name: string
  avatar_text: string
  avatar_color: string
  is_teacher: boolean
  content: string
  created_at: string
  reactions: { emoji: string; count: number }[]
}

export interface AnnouncementOut {
  id: number
  title: string
  content: string
  category: string
  is_pinned: boolean
  is_urgent: boolean
  author_id: number
  author_name: string
  views: number
  created_at: string
  is_read: boolean
}

export interface AssignmentOut {
  id: number
  title: string
  description?: string
  subject: string
  teacher_id: number
  teacher_name: string
  due_date: string
  max_score: number
  created_at: string
  is_submitted: boolean
  submission_id?: number
}

export interface SubmissionOut {
  id: number
  assignment_id: number
  student_id: number
  content?: string
  file_name?: string
  score?: number
  submitted_at: string
}

export interface GradeOut {
  id: number
  subject: string
  score: number
  prev_score?: number
  rank?: number
  total_students: number
  semester: string
  teacher?: string
}

export interface ScheduleItem {
  id: number
  day: string
  period: number
  subject: string
  teacher?: string
  room?: string
}

export interface EventOut {
  id: number
  title: string
  event_type: string
  event_date: string
  description?: string
}

export interface QnAPostOut {
  id: number
  title: string
  content: string
  subject: string
  author_id: number
  author_name: string
  likes: number
  is_answered: boolean
  created_at: string
  answer_count: number
  answers: QnAAnswerOut[]
}

export interface QnAAnswerOut {
  id: number
  content: string
  author_id: number
  author_name: string
  avatar_text: string
  avatar_color: string
  is_accepted: boolean
  created_at: string
}

export interface NotificationOut {
  id: number
  type: string
  title: string
  sender?: string
  tag?: string
  is_read: boolean
  created_at: string
}
