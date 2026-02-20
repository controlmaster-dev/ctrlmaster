export interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
  active?: boolean
  // Legacy fields for JSON data compatibility
  avatar?: string
  department?: string
  shift?: string
  joinDate?: string
  createdAt?: string | Date
}

// ... other exports ...

export interface ReportView {
  id: string
  userId: string
  reportId: string
  viewedAt: string
  user: User
}

export interface CommentReaction {
  id: string
  emoji: string
  authorId: string
  commentId: string
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  reportId: string
  authorId: string
  parentId?: string | null
  author: User
  reactions?: CommentReaction[]
}

export interface Reaction {
  id: string
  emoji: string
  authorId: string
  reportId: string
  author: User
}

export interface Attachment {
  id: string
  url: string
  type: 'IMAGE' | 'VIDEO'
  data?: string // Base64 content
  reportId: string
  createdAt: string
}

export interface Report {
  id: string
  operatorId: string
  operatorName: string
  operatorEmail: string
  problemDescription: string
  dateStarted: string
  dateResolved?: string
  isResolved: boolean
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'Enlace' | 'EJTV' | 'EnlaceUSA' | 'Todos'
  category: string
  emailStatus?: 'none' | 'pending' | 'sent' | 'error'
  emailRecipients?: string
  createdAt: string
  updatedAt: string
  resolvedBy?: string
  notes?: string
  comments?: Comment[]
  reactions?: Reaction[]
  views?: ReportView[]
  attachments?: Attachment[]
}

export interface DashboardStats {
  totalReports: number
  pendingReports: number
  resolvedReports: number
  criticalReports: number
  reportsToday: number
  averageResolutionTime: number
}