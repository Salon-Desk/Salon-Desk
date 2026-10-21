'use client'

import React, { useEffect, useRef, useState } from 'react'
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

/**
 * Chat Floating Action Button (FAB).
 * Anchored to the bottom-right corner by default like regular modern chat apps.
 * Supports smooth drag-and-drop repositioning with boundary clamping and state persistence.
 */
export function DraggableChatFab({ portal, onClick, className }: DraggableChatFabProps) {
  const dispatch = useDispatch()
  const customPosition = useSelector((state: RootState) => state.agentChat?.fabPosition)
  const chrome = portalChrome(portal)
  const FabIcon = chrome.Icon

  const fabRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [livePosition, setLivePosition] = useState<{ x: number; y: number } | null>(
    customPosition ?? null,
  )
  const dragStartRef = useRef<{
    startX: number
    startY: number
    initialX: number
    initialY: number
  } | null>(null)
  const hasMovedRef = useRef(false)

  // Sync with Redux position updates (e.g. storage hydration or reset)
  useEffect(() => {
    setLivePosition(customPosition ?? null)
  }, [customPosition])

  // Handle window resize clamp when in custom position
  useEffect(() => {
    if (!livePosition) return

    const handleResize = () => {
      setLivePosition((prev) => {
        if (!prev) return null
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
  }, [livePosition, dispatch])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return

    const rect = fabRef.current?.getBoundingClientRect()
    const initialX = rect ? rect.left : (livePosition?.x ?? window.innerWidth - FAB_SIZE - 24)
    const initialY = rect ? rect.top : (livePosition?.y ?? window.innerHeight - FAB_SIZE - 24)

    hasMovedRef.current = false
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
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
      setLivePosition({ x: nextX, y: nextY })
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }

    // Prevent click event from firing after drag
    e.stopPropagation()
    e.preventDefault()

    if (hasMovedRef.current && livePosition) {
      // Check if dropped near bottom-right corner (within 40px), snap back to clean CSS positioning
      const isNearBottomRight =
        window.innerWidth - (livePosition.x + FAB_SIZE) <= 40 &&
        window.innerHeight - (livePosition.y + FAB_SIZE) <= 40

      if (isNearBottomRight) {
        setLivePosition(null)
        dispatch(setFabPosition(null))
      } else {
        dispatch(setFabPosition(livePosition))
      }
    } else {
      // Simple click/tap - delay slightly to ensure drag state is cleared
      setTimeout(() => {
        if (!hasMovedRef.current) {
          onClick()
        }
      }, 0)
    }

    dragStartRef.current = null
    setIsDragging(false)
    hasMovedRef.current = false
  }

  const isCustomPlaced = livePosition !== null

  return (
    <div
      ref={fabRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={
        isCustomPlaced
          ? {
              transform: `translate3d(${livePosition.x}px, ${livePosition.y}px, 0)`,
              touchAction: 'none',
            }
          : undefined
      }
      className={cn(
        'z-40 select-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-90 scale-105',
        isCustomPlaced
          ? 'fixed left-0 top-0 transition-none'
          : 'fixed bottom-6 right-6 transition-transform duration-200 ease-out',
        className,
      )}
    >
      <button
        type="button"
        aria-label={chrome.fabLabel}
        title={`${chrome.fabTitle} (Drag to move)`}
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.14)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer',
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
