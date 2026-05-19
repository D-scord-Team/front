'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { scheduleApi, ScheduleItem, EventOut } from '@/lib/api'
import { getErrorMessage } from '@/lib/errorHandler'
import { Calendar, Clock, MapPin, Plus, X, Trash2, Pencil, Lock } from 'lucide-react'

const DAYS = ['월', '화', '수', '목', '금'] as const
const TIMES = [
  '08:50–09:40', '09:50–10:40', '10:50–11:40', '11:50–12:40',
  '13:40–14:30', '14:40–15:30', '15:40–16:30',
]

const SUBJECT_COLORS: Record<string, string> = {
  '국어': '#fef2f2', '수학': '#f5f3ff', '영어': '#eff6ff',
  '과학': '#fff7ed', '사회': '#fdf4ff', '체육': '#f0fdfa',
  '음악': '#fff1f2', '미술': '#f0fdf4', '프로그래밍': '#f0fdf4',
  '물리': '#fff7ed', '화학': '#ecfeff', '생물': '#f0fdf4',
  '한국사': '#fef2f2', '역사': '#fef2f2', '도덕': '#fdf4ff',
}

type Cell = ScheduleItem | undefined

export default function SchedulePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [events, setEvents] = useState<EventOut[]>([])
  const [loading, setLoading] = useState(true)

  // 보고 있는 학급 (담임 교사면 본인 담임반이 기본)
  const [viewGrade, setViewGrade] = useState<number | undefined>()
  const [viewClass, setViewClass] = useState<number | undefined>()

  // 편집 모달
  const [editing, setEditing] = useState<{ day: string; period: number; existing?: ScheduleItem } | null>(null)
  const [formSubject, setFormSubject] = useState('')
  const [formTeacher, setFormTeacher] = useState('')
  const [formRoom, setFormRoom] = useState('')
  const [saving, setSaving] = useState(false)

  // 사용자 역할에 따라 viewGrade/viewClass 초기값 결정
  useEffect(() => {
    if (!user) return
    if (user.role === 'student') {
      setViewGrade(user.grade)
      setViewClass(user.class)
    } else {
      // 교사: 담임 학급이 있으면 그거, 아니면 1학년 1반 (탐색용 기본)
      setViewGrade(user.homeroomGrade ?? 1)
      setViewClass(user.homeroomClass ?? 1)
    }
  }, [user])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tt, ev] = await Promise.all([
        scheduleApi.timetable(viewGrade, viewClass).catch(() => []),
        scheduleApi.events().catch(() => []),
      ])
      setItems(tt as ScheduleItem[])
      setEvents(ev as EventOut[])
    } finally {
      setLoading(false)
    }
  }, [viewGrade, viewClass])

  useEffect(() => {
    if (viewGrade && viewClass) load()
  }, [load, viewGrade, viewClass])

  // 셀 lookup 맵
  const ttMap: Record<string, Record<number, ScheduleItem>> = {}
  items.forEach(s => {
    if (!ttMap[s.day]) ttMap[s.day] = {}
    ttMap[s.day][s.period] = s
  })

  // 오늘 요일
  const todayIdx = new Date().getDay() // 일=0, 월=1...
  const todayDay = todayIdx >= 1 && todayIdx <= 5 ? DAYS[todayIdx - 1] : null

  // 편집 권한: 교사 + 본인 담임 학급과 보고 있는 학급이 일치
  const canEdit = !!(
    user?.role === 'teacher' &&
    user.homeroomGrade != null &&
    user.homeroomClass != null &&
    user.homeroomGrade === viewGrade &&
    user.homeroomClass === viewClass
  )

  const openEditor = (day: string, period: number) => {
    if (!canEdit) return
    const existing = ttMap[day]?.[period]
    setEditing({ day, period, existing })
    setFormSubject(existing?.subject ?? '')
    setFormTeacher(existing?.teacher ?? '')
    setFormRoom(existing?.room ?? '')
  }

  const closeEditor = () => {
    setEditing(null)
    setFormSubject(''); setFormTeacher(''); setFormRoom('')
  }

  const handleSave = async () => {
    if (!editing || !viewGrade || !viewClass || !formSubject.trim()) return
    setSaving(true)
    try {
      await scheduleApi.upsertTimetable({
        grade: viewGrade,
        class_num: viewClass,
        day: editing.day,
        period: editing.period,
        subject: formSubject.trim(),
        teacher: formTeacher.trim() || undefined,
        room: formRoom.trim() || undefined,
      })
      await load()
      closeEditor()
    } catch (e: any) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing?.existing) return
    if (!confirm('이 수업을 삭제할까요?')) return
    setSaving(true)
    try {
      await scheduleApi.deleteTimetable(editing.existing.id)
      await load()
      closeEditor()
    } catch (e: any) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={24} color="#1a7a6e" /> 시간표
            </h1>
            <p>
              {viewGrade && viewClass
                ? `${viewGrade}학년 ${viewClass}반 시간표`
                : '시간표 정보가 없습니다'}
              {canEdit && <span style={{ marginLeft: 8, fontSize: 12, color: '#1a7a6e', fontWeight: 700 }}>· 담임 편집 모드</span>}
            </p>
          </div>

          {/* 교사: 다른 반 시간표 보기 */}
          {user?.role === 'teacher' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="input"
                value={viewGrade ?? ''}
                onChange={e => setViewGrade(Number(e.target.value))}
                style={{ width: 90, cursor: 'pointer' }}
              >
                {[1, 2, 3].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
              <select
                className="input"
                value={viewClass ?? ''}
                onChange={e => setViewClass(Number(e.target.value))}
                style={{ width: 90, cursor: 'pointer' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* 시간표 그리드 */}
          <div className="card" style={{ padding: 16 }}>
            {!viewGrade || !viewClass ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#aab8b5' }}>
                학급 정보가 없습니다
              </div>
            ) : loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#aab8b5' }}>불러오는 중...</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '70px repeat(5, 1fr)',
                border: '1px solid #e8f0ee', borderRadius: 10, overflow: 'hidden',
              }}>
                {/* 헤더 */}
                <div style={{ background: '#f6faf9', padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#6b8a85', borderBottom: '1px solid #e8f0ee' }}>교시</div>
                {DAYS.map(d => (
                  <div key={d} style={{
                    background: d === todayDay ? '#e8f5f3' : '#f6faf9',
                    padding: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: 800,
                    color: d === todayDay ? '#1a7a6e' : '#3d5a56',
                    borderLeft: '1px solid #e8f0ee', borderBottom: '1px solid #e8f0ee',
                  }}>
                    {d}{d === todayDay && <span style={{ fontSize: 9, marginLeft: 4, color: '#1a7a6e' }}>오늘</span>}
                  </div>
                ))}

                {/* 셀 */}
                {TIMES.map((time, i) => (
                  <React.Fragment key={`row-${i}`}>
                    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e8f0ee', background: '#fafcfc' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a7a6e' }}>{i + 1}</div>
                      <div style={{ fontSize: 10, color: '#aab8b5', marginTop: 2, whiteSpace: 'nowrap' }}>{time.split('–')[0]}</div>
                    </div>
                    {DAYS.map(d => {
                      const cls = ttMap[d]?.[i + 1]
                      return (
                        <div
                          key={`${d}${i}`}
                          onClick={() => openEditor(d, i + 1)}
                          style={{
                            padding: '10px',
                            borderLeft: '1px solid #e8f0ee', borderBottom: '1px solid #e8f0ee',
                            background: cls ? (SUBJECT_COLORS[cls.subject] || 'white') : 'white',
                            minHeight: 70,
                            outline: d === todayDay ? '2px solid rgba(26,122,110,0.15)' : 'none',
                            outlineOffset: -1,
                            cursor: canEdit ? 'pointer' : 'default',
                            transition: 'background 0.15s',
                            position: 'relative',
                          }}
                          onMouseEnter={e => { if (canEdit) (e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #1a7a6e') }}
                          onMouseLeave={e => { if (canEdit) (e.currentTarget.style.boxShadow = 'none') }}
                        >
                          {cls ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e2b' }}>{cls.subject}</div>
                              {cls.teacher && <div style={{ fontSize: 11, color: '#6b8a85', marginTop: 2 }}>{cls.teacher}</div>}
                              {cls.room && <div style={{ fontSize: 10, color: '#aab8b5', marginTop: 2 }}>{cls.room}</div>}
                            </>
                          ) : canEdit ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#cbd6d3' }}>
                              <Plus size={18} />
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            )}

            {!canEdit && user?.role === 'teacher' && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: '#fafcfc', border: '1px solid #e8f0ee', borderRadius: 10, fontSize: 12, color: '#6b8a85', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} /> 본인 담임 학급의 시간표만 수정할 수 있습니다
              </div>
            )}
          </div>

          {/* 학사 일정 */}
          <div className="card">
            <div className="card-header"><span className="card-title">📅 학사 일정</span></div>
            {events.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#aab8b5', fontSize: 13 }}>예정된 일정이 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {events.slice(0, 12).map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 9, background: '#f6faf9', border: '1px solid #e8f0ee' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 44, padding: '4px 0', background: 'white', borderRadius: 7, border: '1px solid #e8f0ee' }}>
                      <div style={{ fontSize: 9, color: '#aab8b5', fontWeight: 700 }}>{new Date(e.event_date).toLocaleDateString('ko-KR', { month: 'short' })}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#1a7a6e' }}>{new Date(e.event_date).getDate()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e2b', marginBottom: 2 }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: '#6b8a85' }}>{e.event_type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 편집 모달 */}
        {editing && (
          <div onClick={closeEditor} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
          }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ width: 440, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b8a85' }}>{viewGrade}학년 {viewClass}반</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b' }}>
                    {editing.day}요일 {editing.period}교시
                  </h3>
                </div>
                <button onClick={closeEditor} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b5' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>과목 *</label>
                  <input className="input" placeholder="예: 수학" value={formSubject} onChange={e => setFormSubject(e.target.value)} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>선생님 (선택)</label>
                  <input className="input" placeholder="예: 김교사" value={formTeacher} onChange={e => setFormTeacher(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 6 }}>교실 (선택)</label>
                  <input className="input" placeholder="예: 3-2 또는 컴퓨터실" value={formRoom} onChange={e => setFormRoom(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'space-between' }}>
                <div>
                  {editing.existing && (
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="btn"
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={closeEditor} className="btn btn-secondary">취소</button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formSubject.trim()}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Pencil size={14} /> {editing.existing ? '수정' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}