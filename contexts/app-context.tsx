"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

// Types
interface Post {
  id: number
  title: string
  platforms: string[]
  scheduledTime: string
  status: string
  thumbnail: string
  caption?: string
  hashtags?: string[]
}

interface NewPostFormData {
  videoSource: string
  videoFile: File | null
  platforms: string[]
  trimStart: number
  trimEnd: number
  autoCrop: boolean
  captionType: string
  customCaption: string
  description: string
  keywords: string
  generatedCaption: string
  hashtags: string[]
  scheduleType: string
  scheduleDate: string
  scheduleTime: string
  title: string // <-- add this line
  originalCaption?: string;
  videoDuration?: number;
  thumbnail?: string;
  thumbnailFile?: File | Blob;
  thumbnailFrameTime?: number;
}

interface UploadJob {
  id: string;
  title: string;
  progress: number;
  step: string;
  error?: string;
}

interface AppState {
  // Navigation
  activeTab: string
  showNewPost: boolean
  newPostStep: number

  // New Post Form
  newPostForm: NewPostFormData
  isGeneratingCaption: boolean
  isGeneratingHashtags: boolean

  // Posts
  scheduledPosts: Post[]

  // Settings
  settings: {
    youtubeConnected: boolean
    instagramConnected: boolean
    aiModel: string
    autoPost: boolean
    notifications: boolean
  }

  // Analytics
  stats: {
    views: number
    likes: number
    shares: number
    watchHours: number // Updated here
  }

  // Upload Jobs
  uploadJobs: UploadJob[];
}

type AppAction =
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_SHOW_NEW_POST"; payload: boolean }
  | { type: "SET_NEW_POST_STEP"; payload: number }
  | { type: "UPDATE_NEW_POST_FORM"; payload: Partial<NewPostFormData> }
  | { type: "RESET_NEW_POST_FORM" }
  | { type: "SET_GENERATING_CAPTION"; payload: boolean }
  | { type: "SET_GENERATING_HASHTAGS"; payload: boolean }
  | { type: "ADD_SCHEDULED_POST"; payload: Post }
  | { type: "UPDATE_SCHEDULED_POST"; payload: { id: number; updates: Partial<Post> } }
  | { type: "DELETE_SCHEDULED_POST"; payload: number }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppState["settings"]> }
  | { type: "HYDRATE_STATE"; payload: Partial<AppState> }
  | { type: "ADD_UPLOAD_JOB"; payload: UploadJob }
  | { type: "UPDATE_UPLOAD_JOB"; payload: { id: string; updates: Partial<UploadJob> } }
  | { type: "REMOVE_UPLOAD_JOB"; payload: string }

// Initial state
const initialNewPostForm: NewPostFormData = {
  videoSource: "",
  videoFile: null,
  platforms: [],
  trimStart: 0,
  trimEnd: 30,
  autoCrop: true,
  captionType: "",
  customCaption: "",
  description: "",
  keywords: "",
  generatedCaption: "",
  hashtags: [],
  scheduleType: "now",
  scheduleDate: "",
  scheduleTime: "",
  title: "" // <-- add this line
}

const initialState: AppState = {
  activeTab: "dashboard",
  showNewPost: false,
  newPostStep: 1,
  newPostForm: initialNewPostForm,
  isGeneratingCaption: false,
  isGeneratingHashtags: false,
  scheduledPosts: [
    {
      id: 1,
      title: "Epic Football Fails Compilation",
      platforms: ["youtube", "instagram"],
      scheduledTime: "2024-01-15T14:30:00Z",
      status: "scheduled",
      thumbnail: "/placeholder.svg?height=80&width=80",
      caption: "🔥 Epic football fails that will make you laugh! Which one is your favorite?",
      hashtags: ["#football", "#fails", "#viral", "#sports"],
    },
    {
      id: 2,
      title: "Top 3 Penalty Misses This Season",
      platforms: ["instagram"],
      scheduledTime: "2024-01-16T18:00:00Z",
      status: "scheduled",
      thumbnail: "/placeholder.svg?height=80&width=80",
      caption: "⚽ The most shocking penalty misses of the season! 😱",
      hashtags: ["#penalty", "#football", "#soccer", "#fails"],
    },
    {
      id: 3,
      title: "Kai Havertz Best Goals",
      platforms: ["youtube"],
      scheduledTime: "2024-01-17T12:00:00Z",
      status: "scheduled",
      thumbnail: "/placeholder.svg?height=80&width=80",
      caption: "🎯 Kai Havertz's most incredible goals! Pure class! ⚽",
      hashtags: ["#KaiHavertz", "#goals", "#football", "#chelsea"],
    },
  ],
  settings: {
    youtubeConnected: false,
    instagramConnected: true,
    aiModel: "gpt-4",
    autoPost: true,
    notifications: true,
  },
  stats: {
    views: 125400,
    likes: 8900,
    shares: 2100,
    watchHours: 2847, // Updated here
  },
  uploadJobs: [],
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload }

    case "SET_SHOW_NEW_POST":
      return { ...state, showNewPost: action.payload }

    case "SET_NEW_POST_STEP":
      return { ...state, newPostStep: action.payload }

    case "UPDATE_NEW_POST_FORM":
      return {
        ...state,
        newPostForm: { ...state.newPostForm, ...action.payload },
      }

    case "RESET_NEW_POST_FORM":
      return {
        ...state,
        newPostForm: initialNewPostForm,
        newPostStep: 1,
        isGeneratingCaption: false,
        isGeneratingHashtags: false,
      }

    case "SET_GENERATING_CAPTION":
      return { ...state, isGeneratingCaption: action.payload }

    case "SET_GENERATING_HASHTAGS":
      return { ...state, isGeneratingHashtags: action.payload }

    case "ADD_SCHEDULED_POST":
      return {
        ...state,
        scheduledPosts: [...state.scheduledPosts, action.payload],
      }

    case "UPDATE_SCHEDULED_POST":
      return {
        ...state,
        scheduledPosts: state.scheduledPosts.map((post) =>
          post.id === action.payload.id ? { ...post, ...action.payload.updates } : post,
        ),
      }

    case "DELETE_SCHEDULED_POST":
      return {
        ...state,
        scheduledPosts: state.scheduledPosts.filter((post) => post.id !== action.payload),
      }

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }

    case "HYDRATE_STATE":
      return { ...state, ...action.payload }

    case "ADD_UPLOAD_JOB":
      return { ...state, uploadJobs: [...state.uploadJobs, action.payload] };
    case "UPDATE_UPLOAD_JOB":
      return {
        ...state,
        uploadJobs: state.uploadJobs.map(job =>
          job.id === action.payload.id ? { ...job, ...action.payload.updates } : job
        ),
      };
    case "REMOVE_UPLOAD_JOB":
      return {
        ...state,
        uploadJobs: state.uploadJobs.filter(job => job.id !== action.payload),
      };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("clippilot-state")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        dispatch({ type: "HYDRATE_STATE", payload: parsedState })
      } catch (error) {
        console.error("Failed to parse saved state:", error)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      newPostForm: state.newPostForm,
      newPostStep: state.newPostStep,
      scheduledPosts: state.scheduledPosts,
      settings: state.settings,
      // Don't save temporary UI states like activeTab, showNewPost, loading states
    }
    localStorage.setItem("clippilot-state", JSON.stringify(stateToSave))
  }, [state.newPostForm, state.newPostStep, state.scheduledPosts, state.settings])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
