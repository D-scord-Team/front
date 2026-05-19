'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { gradesApi, GradeOut } from '@/lib/api'
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const gradeLabel = (score: number) => {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'B+'
  if (score >= 80) return 'B'
  if (score >= 75) return 'C+'
  return 'C'
}

const gradeColors: Record<string, string> = {
  'A+': '#22c55e', 'A': '#3b82f6', 'B+': '#8b5cf6', 'B': '#f97316', 'C+': '#eab308', 'C': '#ef4444',
}
const subjectColors: Record<string, string> = {
  '국어': '#ef4444', '수학': '#8b5cf6', '영어': '#3b82f6', '물리': '#f97316',
  '역사': '#d946ef', '프로그래밍': '#22c55e', '체육': '#14b8a6',
}

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gradesApi.mine().then(setGrades).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aab8b5' }}>불러오는 중...</main>
    </div>
  )

  const avg = grades.length ? Math.round(grades.reduce((a, b) => a + b.score, 0) / grades.length) : 0
  const prevAvg = grades.length ? Math.round(grades.reduce((a, b) => a + (b.prev_score ?? b.score), 0) / grades.length) : 0
  const best = grades.length ? grades.reduce((a, b) => a.score > b.score ? a : b) : null
  const worst = grades.length ? grades.reduce((a, b) => a.score < b.score ? a : b) : null
  const avgRank = grades.length ? Math.round(grades.reduce((a, b) => a + (b.rank ?? 0), 0) / grades.length) : 0

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={24} color="#1a7a6e" /> 성적 현황
          </h1>
          <p>{grades[0]?.semester ? `${grades[0].semester} 학기` : '성적 정보 없음'}</p>
        </div>

        {grades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#aab8b5' }}>
            <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>등록된 성적이 없습니다</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: '전체 평균', value: `${avg}점`, sub: `이전 ${prevAvg}점`, trend: avg > prevAvg ? 'up' : avg < prevAvg ? 'down' : 'same', color: '#1a7a6e' },
                { label: '최고 과목', value: best?.subject || '-', sub: `${best?.score || 0}점`, trend: 'up', color: '#22c55e' },
                { label: '최저 과목', value: worst?.subject || '-', sub: `${worst?.score || 0}점`, trend: 'down', color: '#f97316' },
                { label: '평균 순위', value: avgRank ? `${avgRank}위` : '-', sub: `전체 ${grades[0]?.total_students || 30}명 중`, trend: 'same', color: '#3b82f6' },
              ].map(c => (
                <div key={c.label} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, color: '#6b8a85', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: c.color, letterSpacing: -1 }}>{c.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    {c.trend === 'up' ? <TrendingUp size={13} color="#22c55e" /> : c.trend === 'down' ? <TrendingDown size={13} color="#ef4444" /> : <Minus size={13} color="#aab8b5" />}
                    <span style={{ fontSize: 12, color: c.trend === 'up' ? '#22c55e' : c.trend === 'down' ? '#ef4444' : '#aab8b5' }}>{c.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8f0ee' }}>
                  <span className="card-title">과목별 성적</span>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>과목</th><th>담당 선생님</th><th>점수</th><th>등급</th><th>반 순위</th><th>이전 대비</th><th>진행도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => {
                      const gl = gradeLabel(g.score)
                      const color = subjectColors[g.subject] || '#1a7a6e'
                      return (
                        <tr key={g.subject}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                              <span style={{ fontWeight: 700 }}>{g.subject}</span>
                            </div>
                          </td>
                          <td style={{ color: '#6b8a85' }}>{g.teacher || '-'}</td>
                          <td><span style={{ fontSize: 15, fontWeight: 800, color: '#1a2e2b' }}>{g.score}</span><span style={{ fontSize: 12, color: '#aab8b5' }}>/100</span></td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700, background: (gradeColors[gl] || '#6b7280') + '22', color: gradeColors[gl] || '#6b7280' }}>{gl}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{g.rank ?? '-'}<span style={{ color: '#aab8b5', fontSize: 12 }}>/{g.total_students}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {g.prev_score == null ? <Minus size={14} color="#aab8b5" /> :
                                g.score > g.prev_score ? <><TrendingUp size={14} color="#22c55e" /><span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>+{g.score - g.prev_score}</span></> :
                                g.score < g.prev_score ? <><TrendingDown size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{g.score - g.prev_score}</span></> :
                                <><Minus size={14} color="#aab8b5" /><span style={{ fontSize: 13, color: '#aab8b5' }}>-</span></>
                              }
                            </div>
                          </td>
                          <td style={{ width: 140 }}>
                            <div style={{ height: 6, background: '#e8f0ee', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${g.score}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">📊 점수 분포</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {grades.map(g => (
                      <div key={g.subject}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#3d5a56', fontWeight: 600 }}>{g.subject}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: subjectColors[g.subject] || '#1a7a6e' }}>{g.score}점</span>
                        </div>
                        <div style={{ height: 8, background: '#e8f0ee', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${g.score}%`, background: subjectColors[g.subject] || '#1a7a6e', borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">🏆 과목 등급</span></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {grades.map(g => {
                      const gl = gradeLabel(g.score)
                      return (
                        <div key={g.subject} style={{ flex: '1 1 calc(50% - 4px)', padding: '10px', borderRadius: 8, background: (gradeColors[gl] || '#6b7280') + '15', border: `1px solid ${(gradeColors[gl] || '#6b7280')}30`, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#6b8a85' }}>{g.subject}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: gradeColors[gl] || '#6b7280' }}>{gl}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
