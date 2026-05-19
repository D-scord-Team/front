import { ApiError } from './api'

// 에러를 사용자 친화적인 메시지로 변환
export function getErrorMessage(error: unknown): string {
  // ApiError인 경우
  if (error instanceof ApiError) {
    // 상태 코드별 기본 메시지
    switch (error.statusCode) {
      case 400:
        return error.message || '잘못된 요청입니다.'
      case 401:
        return error.message || '로그인이 필요합니다.'
      case 403:
        return error.message || '권한이 없습니다.'
      case 404:
        return error.message || '요청한 데이터를 찾을 수 없습니다.'
      case 409:
        return error.message || '이미 존재하는 데이터입니다.'
      case 422:
        return error.message || '입력 데이터가 올바르지 않습니다.'
      case 429:
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 0:
        return error.message // 네트워크 에러
      default:
        return error.message || '알 수 없는 오류가 발생했습니다.'
    }
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    return error.message
  }

  // 기타
  return '알 수 없는 오류가 발생했습니다.'
}

// 에러 상세 정보 포맷팅 (검증 에러 등)
export function formatErrorDetails(error: unknown): string[] {
  if (error instanceof ApiError && error.details) {
    // Zod 검증 에러 형식
    if (Array.isArray(error.details)) {
      return error.details.map((detail: any) => {
        if (detail.field && detail.message) {
          return `${detail.field}: ${detail.message}`
        }
        return detail.message || String(detail)
      })
    }
    
    // 객체 형식
    if (typeof error.details === 'object') {
      return Object.entries(error.details).map(([key, value]) => {
        return `${key}: ${value}`
      })
    }
  }
  
  return []
}

// 에러가 인증 관련인지 확인
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 401
  }
  return false
}

// 에러가 권한 관련인지 확인
export function isPermissionError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 403
  }
  return false
}

// 에러가 네트워크 관련인지 확인
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 0
  }
  return false
}
