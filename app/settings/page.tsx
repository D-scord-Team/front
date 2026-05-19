'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi } from '@/lib/api'
import { Settings, User, Bell, Palette, Shield, ChevronRight, Camera, Check, LogOut } from 'lucide-react'

const settingsSections = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'appearance', label: '화면 설정', icon: Palette },
  { id: 'privacy', label: '개인정보', icon: Shield },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#1a7a6e' : '#e2e8e6', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [active, setActive] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [notifs, setNotifs] = useState({ notice: true, assignment: true, chat: true, email: false, push: true, sound: false })
  const [appearance, setAppearance] = useState({ theme: 'light', fontSize: 'medium', compact: false })

  const handleLogout = () => { logout(); router.push('/login') }

  // 상세 프로필 로드
  useEffect(() => {
    import('@/lib/api').then(({ authApi }) => {
      authApi.me().then(me => {
        setPhone(me.phone || '')
        setEmail(me.email || '')
        setBio(me.bio || '')
      }).catch(() => {})
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateMe({ phone, email, bio })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={24} color="#1a7a6e" /> 설정
          </h1>
          <p>계정 및 앱 설정을 관리하세요</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 8, alignSelf: 'start' }}>
            {settingsSections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                border: 'none', cursor: 'pointer', borderRadius: 8, textAlign: 'left',
                background: active === s.id ? '#e8f5f3' : 'transparent',
                color: active === s.id ? '#1a7a6e' : '#3d5a56',
                fontWeight: active === s.id ? 700 : 500, fontSize: 14,
                fontFamily: 'Pretendard, sans-serif', transition: 'all 0.15s',
              }}>
                <s.icon size={16} />
                {s.label}
                {active === s.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
            <div style={{ height: 1, background: '#e8f0ee', margin: '8px 4px' }} />
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
              border: 'none', cursor: 'pointer', borderRadius: 8, textAlign: 'left',
              background: 'transparent', color: '#ef4444',
              fontWeight: 500, fontSize: 14, fontFamily: 'Pretendard, sans-serif', transition: 'all 0.15s',
            }}>
              <LogOut size={16} /> 로그아웃
            </button>
          </div>

          <div className="card fade-in" style={{ padding: 28 }}>
            {active === 'profile' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b', marginBottom: 24 }}>프로필 설정</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '20px', background: '#f6faf9', borderRadius: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: user?.avatarColor || '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
                      {user?.avatarText || '?'}
                    </div>
                    <button style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#1a7a6e', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={11} color="white" />
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b' }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: '#6b8a85' }}>
                      {user?.role === 'student' ? `${user.grade}학년 ${user.class}반 · ${user.number}번` : user?.subject}
                    </div>
                    <div style={{ fontSize: 12, color: '#aab8b5', marginTop: 2 }}>
                      {user?.role === 'student' ? '학생' : '선생님'} 계정
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  {[
                    { label: '이름', val: user?.name || '', readonly: true },
                    { label: '역할', val: user?.role === 'student' ? '학생' : '선생님', readonly: true },
                    ...(user?.role === 'student' ? [
                      { label: '학년/반/번호', val: `${user.grade}학년 ${user.class}반 ${user.number}번`, readonly: true },
                    ] : [
                      { label: '담당 과목', val: user?.subject || '', readonly: true },
                    ]),
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>{f.label}</label>
                      <input className="input" defaultValue={f.val} readOnly={f.readonly} style={{ background: '#f6faf9', color: '#6b8a85' }} />
                      {f.readonly && <p style={{ fontSize: 11, color: '#aab8b5', marginTop: 4 }}>변경 불가</p>}
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>연락처</label>
                    <input className="input" placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>이메일</label>
                    <input className="input" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#3d5a56', display: 'block', marginBottom: 7 }}>자기소개 (선택)</label>
                  <textarea className="input" placeholder="자기소개를 입력하세요..." value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 80 }} />
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => { setPhone(''); setEmail(''); setBio('') }}>초기화</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {saved ? <><Check size={14} /> 저장됨</> : saving ? '저장 중...' : '변경사항 저장'}
                  </button>
                </div>
              </div>
            )}

            {active === 'notifications' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b', marginBottom: 24 }}>알림 설정</h3>
                {[
                  { key: 'notice', label: '공지사항 알림', desc: '새 공지가 등록되면 알림을 받습니다' },
                  { key: 'assignment', label: '과제 마감 알림', desc: '마감 1일 전, 당일에 알림을 받습니다' },
                  { key: 'chat', label: '채팅 알림', desc: '새 메시지가 오면 알림을 받습니다' },
                  { key: 'push', label: '푸시 알림', desc: '브라우저 푸시 알림을 허용합니다' },
                  { key: 'email', label: '이메일 수신', desc: '학교 이메일로 알림을 받습니다' },
                  { key: 'sound', label: '알림 소리', desc: '알림 시 소리를 재생합니다' },
                ].map(n => (
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f0f4f3' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2e2b' }}>{n.label}</div>
                      <div style={{ fontSize: 12, color: '#aab8b5', marginTop: 2 }}>{n.desc}</div>
                    </div>
                    <Toggle on={notifs[n.key as keyof typeof notifs]} onChange={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof notifs] }))} />
                  </div>
                ))}
              </div>
            )}

            {active === 'appearance' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b', marginBottom: 24 }}>화면 설정</h3>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#1a2e2b', display: 'block', marginBottom: 12 }}>테마</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ val: 'light', label: '라이트', preview: '#ffffff' }, { val: 'dark', label: '다크', preview: '#1a2e2b' }, { val: 'auto', label: '시스템', preview: 'linear-gradient(135deg, #fff 50%, #1a2e2b 50%)' }].map(t => (
                      <div key={t.val} onClick={() => setAppearance(a => ({ ...a, theme: t.val }))} style={{ width: 110, cursor: 'pointer', border: `2px solid ${appearance.theme === t.val ? '#1a7a6e' : '#e2e8e6'}`, borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ height: 60, background: t.preview }} />
                        <div style={{ padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#3d5a56' }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f0f4f3' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2e2b' }}>컴팩트 모드</div>
                    <div style={{ fontSize: 12, color: '#aab8b5', marginTop: 2 }}>더 많은 정보를 화면에 표시합니다</div>
                  </div>
                  <Toggle on={appearance.compact} onChange={() => setAppearance(a => ({ ...a, compact: !a.compact }))} />
                </div>
              </div>
            )}

            {active === 'privacy' && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e2b', marginBottom: 24 }}>개인정보 설정</h3>
                {[
                  { label: '프로필 공개 범위', desc: '내 프로필을 볼 수 있는 범위', options: ['전체', '같은 반', '나만'] },
                  { label: '온라인 상태 표시', desc: '접속 중인지 표시합니다', options: ['항상 표시', '같은 반만', '숨김'] },
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px 0', borderBottom: '1px solid #f0f4f3' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e2b', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: '#aab8b5', marginBottom: 10 }}>{s.desc}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.options.map(o => (
                        <button key={o} className="btn" style={{ padding: '6px 14px', fontSize: 12, background: 'white', color: '#6b8a85', border: '1.5px solid #e2e8e6' }}>{o}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
