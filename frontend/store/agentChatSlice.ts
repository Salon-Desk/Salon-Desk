import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AgentChatMessage } from '@/components/chat/useAgentChat'
import { type AssistantPortal, welcomeMessageForPortal } from '@/lib/assistant-portal'
import { features } from '@/lib/features'

export type ChatMode = 'chat' | 'voice'

export interface FabPosition {
  x: number
  y: number
}

export interface AgentChatState {
  isOpen: boolean
  isMinimized: boolean
  mode: ChatMode
  portal: AssistantPortal
  messages: AgentChatMessage[]
  prompt: string
  fabPosition: FabPosition | null
}

function initialMode(): ChatMode {
  if (features.agentChat) return 'chat'
  if (features.voiceAgent) return 'voice'
  return 'chat'
}

function getStoredFabPosition(): FabPosition | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('salondesk_fab_position')
    if (raw) {
      const parsed = JSON.parse(raw) as { x?: number; y?: number }
      if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
        return { x: parsed.x, y: parsed.y }
      }
    }
  } catch {
    /* fallback to default */
  }
  return null
}

export function buildWelcomeMessage(portal: AssistantPortal): AgentChatMessage {
  return {
    id: `msg-welcome-${portal}`,
    sender: 'assistant',
    text: welcomeMessageForPortal(portal),
    time: 'Just now',
  }
}

const initialState: AgentChatState = {
  isOpen: false,
  isMinimized: false,
  mode: initialMode(),
  portal: 'client',
  messages: [buildWelcomeMessage('client')],
  prompt: '',
  fabPosition: null,
}

export const agentChatSlice = createSlice({
  name: 'agentChat',
  initialState,
  reducers: {
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
      if (!action.payload) {
        state.isMinimized = false
      }
    },
    toggleChatOpen: (state) => {
      state.isOpen = !state.isOpen
      if (!state.isOpen) {
        state.isMinimized = false
      }
    },
    setChatMinimized: (state, action: PayloadAction<boolean>) => {
      state.isMinimized = action.payload
    },
    setChatMode: (state, action: PayloadAction<ChatMode>) => {
      state.mode = action.payload
    },
    setChatPortal: (state, action: PayloadAction<AssistantPortal>) => {
      if (state.portal !== action.payload) {
        state.portal = action.payload
        // Update welcome message if only initial welcome message is present
        if (state.messages.length <= 1 && state.messages[0]?.id.startsWith('msg-welcome')) {
          state.messages = [buildWelcomeMessage(action.payload)]
        }
      }
    },
    setChatPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload
    },
    setChatMessages: (state, action: PayloadAction<AgentChatMessage[]>) => {
      state.messages = action.payload
    },
    appendChatMessage: (state, action: PayloadAction<AgentChatMessage>) => {
      state.messages.push(action.payload)
    },
    setFabPosition: (state, action: PayloadAction<FabPosition | null>) => {
      state.fabPosition = action.payload
      if (typeof window !== 'undefined') {
        try {
          if (action.payload) {
            localStorage.setItem('salondesk_fab_position', JSON.stringify(action.payload))
          } else {
            localStorage.removeItem('salondesk_fab_position')
          }
        } catch {
          /* ignore */
        }
      }
    },
    hydrateFabPositionFromStorage: (state) => {
      const pos = getStoredFabPosition()
      if (pos) {
        state.fabPosition = pos
      }
    },
    resetChatConversation: (state) => {
      state.messages = [buildWelcomeMessage(state.portal)]
      state.prompt = ''
      state.isMinimized = false
    },
  },
})

export const {
  setChatOpen,
  toggleChatOpen,
  setChatMinimized,
  setChatMode,
  setChatPortal,
  setChatPrompt,
  setChatMessages,
  appendChatMessage,
  setFabPosition,
  hydrateFabPositionFromStorage,
  resetChatConversation,
} = agentChatSlice.actions

export const agentChatReducer = agentChatSlice.reducer
