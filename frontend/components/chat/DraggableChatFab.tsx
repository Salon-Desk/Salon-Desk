'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { type AssistantPortal, portalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'
import type { RootState } from '@/store'
import { setFabPosition } from '@/store/agentChatSlice'

interface DraggableChatFabProps {
  portal: AssistantPortal
  onClick: () => void
  className?: string
}

const FAB_SIZE = 56
const PADDING = 16

export function DraggableChatFab({ portal, onClick, className }: DraggableChatFabProps) {
  const dispatch = useDispatch()
  const customPosition = useSelector((state: RootState) => state.agentChat?.fabPosition)
  const chrome = portalChrome(portal)
  const FabIcon = chrome.Icon

  const fabRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{
    startX: number
    startY: number
    initialX: number
    initialY: number
  } | null>(null)
  const hasMovedRef = useRef(false)

  // Default position: bottom-right
  const getInitialPosition = useCallback(() => {
    if (customPosition) return customPosition
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    return {
      x: window.innerWidth - FAB_SIZE - 24,
      y: window.innerHeight - FAB_SIZE - 24,
    }
  }, [customPosition])

  const [position, setPosition] = useState<{ x: number; y: number }>(getInitialPosition)

  useEffect(() => {
    if (customPosition) {
      setPosition(customPosition)
    } else if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - FAB_SIZE - 24,
        y: window.innerHeight - FAB_SIZE - 24,
      })
    }
  }, [customPosition])

  // Handle window resize clamp
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - FAB_SIZE - PADDING
        const maxY = window.innerHeight - FAB_SIZE - PADDING
        const clampedX = Math.max(PADDING, Math.min(maxX, prev.x))
        const clampedY = Math.max(PADDING, Math.min(maxY, prev.y))
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { x: clampedX, y: clampedY }
          dispatch(setFabPosition(next))
          return next
        }
        return prev
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button
    if (e.button !== 0) return
    hasMovedRef.current = false
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    }
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY

    if (!hasMovedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      hasMovedRef.current = true
    }

    if (hasMovedRef.current) {
      const maxX = window.innerWidth - FAB_SIZE - PADDING
      const maxY = window.innerHeight - FAB_SIZE - PADDING
      const nextX = Math.max(PADDING, Math.min(maxX, dragStartRef.current.initialX + dx))
      const nextY = Math.max(PADDING, Math.min(maxY, dragStartRef.current.initialY + dy))
      setPosition({ x: nextX, y: nextY })
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }

    if (hasMovedRef.current) {
      // Finished dragging, save position
      dispatch(setFabPosition(position))
    } else {
      // Tap / click without dragging
      onClick()
    }

    dragStartRef.current = null
    setIsDragging(false)
    hasMovedRef.current = false
  }

  return (
    <div
      ref={fabRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={cn(
        'fixed left-0 top-0 z-40 cursor-grab active:cursor-grabbing select-none',
        isDragging ? 'transition-none' : 'transition-transform duration-150 ease-out',
        className,
      )}
    >
      <button
        type="button"
        aria-label={chrome.fabLabel}
        title={`${chrome.fabTitle} (Drag to reposition)`}
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95',
          chrome.fabButton,
        )}
      >
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110',
            chrome.fabIconWrap,
          )}
        >
          <FabIcon className={cn('h-5 w-5', chrome.fabIcon)} />
        </span>
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 pointer-events-none">
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              chrome.fabPing,
            )}
          />
          <span
            className={cn('relative inline-flex h-3.5 w-3.5 rounded-full border-2', chrome.fabDot)}
          />
        </span>
        <span className="sr-only">{chrome.fabLabel}</span>
      </button>
    </div>
  )
}
