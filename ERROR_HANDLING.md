# 프론트엔드 에러 처리 가이드

## 개요

백엔드의 구조화된 에러 응답을 제대로 처리하기 위한 시스템입니다.

---

## 1. ApiError 클래스

모든 API 에러는 `ApiError` 클래스로 래핑됩니다.

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,    // HTTP 상태 코드
    public message: string,        // 에러 메시지
    public details?: any           // 추가 상세 정보 (검증 에러 등)
  )
}
```

### 자동 처리되는 에러:

- **400 Bad Request** — 잘못된 요청
- **401 Unauthorized** — 인증 필요
- **403 Forbidden** — 권한 없음
- **404 Not Found** — 리소스 없음
- **409 Conflict** — 중복 데이터
- **422 Unprocessable Entity** — 검증 실패
- **429 Too Many Requests** — Rate Limit 초과
- **500 Internal Server Error** — 서버 오류
- **0** — 네트워크 에러 (서버 연결 불가)

---

## 2. 에러 처리 유틸리티

### `getErrorMessage(error)`

에러를 사용자 친화적인 메시지로 변환합니다.

```typescript
import { getErrorMessage } from '@/lib/errorHandler'

try {
  await authApi.login(username, password)
} catch (error) {
  const message = getErrorMessage(error)
  setError(message)
}
```

### `formatErrorDetails(error)`

검증 에러 등의 상세 정보를 배열로 반환합니다.

```typescript
import { formatErrorDetails } from '@/lib/errorHandler'

try {
  await authApi.signup(data)
} catch (error) {
  const details = formatErrorDetails(error)
  // ['email: 올바른 이메일 형식이 아닙니다.', 'password: 비밀번호는 최소 6자 이상이어야 합니다.']
}
```

### 에러 타입 확인

```typescript
import { isAuthError, isPermissionError, isNetworkError } from '@/lib/errorHandler'

try {
  await api.getData()
} catch (error) {
  if (isAuthError(error)) {
    // 로그인 페이지로 리다이렉트
    router.push('/login')
  } else if (isPermissionError(error)) {
    // 권한 없음 메시지 표시
    alert('권한이 없습니다.')
  } else if (isNetworkError(error)) {
    // 네트워크 에러 처리
    alert('서버에 연결할 수 없습니다.')
  }
}
```

---

## 3. ErrorMessage 컴포넌트

에러를 시각적으로 표시하는 공통 컴포넌트입니다.

```typescript
import ErrorMessage from '@/components/ErrorMessage'

function MyComponent() {
  const [error, setError] = useState<unknown>(null)

  return (
    <div>
      {error && <ErrorMessage error={error} />}
      {/* ... */}
    </div>
  )
}
```

### Props:

- `error: unknown` — 에러 객체 (필수)
- `className?: string` — 추가 CSS 클래스 (선택)

### 표시 내용:

- 에러 메시지 (빨간색 배경)
- 상세 정보 (있는 경우 목록으로 표시)

---

## 4. 사용 예시

### 로그인 에러 처리

```typescript
const handleLogin = async () => {
  try {
    await login(username, password)
    router.push('/dashboard')
  } catch (error) {
    setError(getErrorMessage(error))
  }
}
```

### 회원가입 에러 처리 (검증 에러 포함)

```typescript
const handleSignup = async () => {
  try {
    await authApi.signup(formData)
    router.push('/dashboard')
  } catch (error) {
    const message = getErrorMessage(error)
    const details = formatErrorDetails(error)
    
    if (details.length > 0) {
      setError(`${message}\n${details.join('\n')}`)
    } else {
      setError(message)
    }
  }
}
```

### 데이터 로딩 에러 처리

```typescript
useEffect(() => {
  async function loadData() {
    try {
      const data = await api.getData()
      setData(data)
    } catch (error) {
      setError(error)
    }
  }
  loadData()
}, [])

return (
  <div>
    {error && <ErrorMessage error={error} />}
    {data && <DataDisplay data={data} />}
  </div>
)
```

### 인증 에러 자동 처리

```typescript
try {
  await api.protectedAction()
} catch (error) {
  if (isAuthError(error)) {
    // 토큰 만료 → 로그아웃 후 로그인 페이지로
    logout()
    router.push('/login')
    return
  }
  
  // 기타 에러
  alert(getErrorMessage(error))
}
```

---

## 5. 백엔드 에러 응답 형식

### 일반 에러

```json
{
  "error": "사용자를 찾을 수 없습니다.",
  "statusCode": 404
}
```

### 검증 에러 (Zod)

```json
{
  "error": "입력 데이터가 올바르지 않습니다.",
  "details": [
    {
      "field": "email",
      "message": "올바른 이메일 형식이 아닙니다."
    },
    {
      "field": "password",
      "message": "비밀번호는 최소 6자 이상이어야 합니다."
    }
  ]
}
```

### Prisma 중복 에러

```json
{
  "error": "이미 존재하는 username입니다."
}
```

---

## 6. 모범 사례

### ✅ 좋은 예

```typescript
// 1. getErrorMessage 사용
try {
  await api.action()
} catch (error) {
  setError(getErrorMessage(error))
}

// 2. ErrorMessage 컴포넌트 사용
{error && <ErrorMessage error={error} />}

// 3. 에러 타입별 처리
if (isAuthError(error)) {
  router.push('/login')
} else {
  alert(getErrorMessage(error))
}
```

### ❌ 나쁜 예

```typescript
// 1. error.message 직접 사용 (타입 안전하지 않음)
catch (error: any) {
  setError(error.message || '오류 발생')
}

// 2. 에러 무시
catch (error) {
  console.log(error)
}

// 3. 모든 에러를 동일하게 처리
catch (error) {
  alert('오류가 발생했습니다.')
}
```

---

## 7. 디버깅

### 개발 환경에서 에러 확인

```typescript
try {
  await api.action()
} catch (error) {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode)
    console.log('Message:', error.message)
    console.log('Details:', error.details)
  }
  
  setError(getErrorMessage(error))
}
```

### 네트워크 탭 확인

1. 브라우저 개발자 도구 → Network 탭
2. 실패한 요청 클릭
3. Response 탭에서 백엔드 에러 응답 확인

---

## 8. 추가 개선 사항

### Toast 알림 추가 (선택)

```typescript
// lib/toast.ts
export function showError(error: unknown) {
  const message = getErrorMessage(error)
  toast.error(message)
}

// 사용
try {
  await api.action()
} catch (error) {
  showError(error)
}
```

### 전역 에러 핸들러 (선택)

```typescript
// app/layout.tsx
useEffect(() => {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    alert(getErrorMessage(event.reason))
  })
}, [])
```

---

**Happy Coding! 🚀**
