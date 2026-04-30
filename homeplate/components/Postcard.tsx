'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const AVATAR_COLORS = ['#D4763A', '#5B8A3C', '#3B8BD4', '#E8C547', '#7F77DD', '#1D9E75']
function avatarColor(str: string) { return AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }
function initials(str: string) { return (str || 'U').slice(0, 2).toUpperCase() }
function timeAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

export default function PostCard({ post, currentUser }: { post: any; currentUser: any }) {
  const supabase = createClient()
  const likeCount = post.likes?.[0]?.count || 0
  const commentCount = post.comments?.[0]?.count || 0
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likes, setLikes] = useState(Number(likeCount))
  const [showNutrition, setShowNutrition] = useState(false)
  const [comment, setComment] = useState('')

  async function toggleLike() {
    if (!currentUser) return
    const action = liked ? 'unlike' : 'like'
    setLiked(!liked)
    setLikes(l => liked ? l - 1 : l + 1)
    await fetch(`/api/posts/${post.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  async function toggleSave() {
    if (!currentUser) return
    const action = saved ? 'unsave' : 'save'
    setSaved(!saved)
    await fetch(`/api/posts/${post.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || !currentUser) return
    await supabase.from('comments').insert({ user_id: currentUser.id, post_id: post.id, content: comment.trim() })
    setComment('')
  }

  const profile = post.profiles
  const hasNutrition = post.calories

  return (
    <div className="post-card">
      <div className="post-card-header">
        <Link href={`/profile/${profile?.username}`} className="post-card-user" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="avatar" style={{ background: avatarColor(profile?.username || '') }}>
            {initials(profile?.display_name || profile?.username || 'U')}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{profile?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(post.created_at)}</div>
          </div>
        </Link>
      </div>

      <div className="post-card-image" style={{ minHeight: 240 }}>
        {post.image_url
          ? <img src={post.image_url} alt={post.dish_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: 'var(--green)', fontSize: 13 }}>No photo</span>
        }
      </div>

      <div className="post-actions">
        <button className={`action-btn${liked ? ' liked' : ''}`} onClick={toggleLike}>
          <HeartIcon filled={liked} /> {likes}
        </button>
        <button className="action-btn">
          <CommentIcon /> {commentCount}
        </button>
        <button className={`action-btn save${saved ? ' liked' : ''}`} onClick={toggleSave}>
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <div className="post-card-body">
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{post.dish_name}</div>
        {post.caption && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{post.caption}</div>}

        {hasNutrition && (
          <div className="nutrition-panel" style={{ marginBottom: 10 }}>
            <div className="nutrition-label">
              Nutrition per serving
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 12, fontFamily: 'inherit' }}
                onClick={() => setShowNutrition(!showNutrition)}>
                {showNutrition ? 'Hide' : 'Full breakdown'}
              </button>
            </div>
            <div className="nutrition-grid">
              <div className="nutrition-stat"><div className="value cal">{post.calories}</div><div className="unit">cal</div></div>
              <div className="nutrition-stat"><div className="value protein">{post.protein_g}g</div><div className="unit">protein</div></div>
              <div className="nutrition-stat"><div className="value carbs">{post.carbs_g}g</div><div className="unit">carbs</div></div>
              <div className="nutrition-stat"><div className="value fat">{post.fat_g}g</div><div className="unit">fat</div></div>
            </div>
            {showNutrition && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>
                {post.fiber_g && <div>Fiber <span style={{ float: 'right', fontWeight: 500 }}>{post.fiber_g}g</span></div>}
                {post.sodium_mg && <div>Sodium <span style={{ float: 'right', fontWeight: 500 }}>{post.sodium_mg}mg</span></div>}
              </div>
            )}
          </div>
        )}

        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {post.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
            {post.cook_time && <span className="tag">{post.cook_time}</span>}
          </div>
        )}

        {currentUser && (
          <form onSubmit={postComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="avatar sm" style={{ background: avatarColor(currentUser.email || ''), flexShrink: 0, marginTop: 2 }}>
              {initials(currentUser.email || 'U')}
            </div>
            <input className="input" style={{ fontSize: 13 }} placeholder="Add a comment..."
              value={comment} onChange={e => setComment(e.target.value)} />
          </form>
        )}
      </div>
    </div>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
}
function CommentIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function BookmarkIcon({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
}