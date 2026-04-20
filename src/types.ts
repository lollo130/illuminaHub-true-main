export interface Note {
  id: string;
  title: string;
  subject?: string;
  date?: string;
  content?: string;
  status?: string;
  type?: string;
  size?: string;
  created_at?: string;
  user_id?: string;
}

export interface Exam {
  id: string;
  name: string;
  date?: string;
  status?: string;
  progress?: number;
  user_id?: string;
}

export interface Lesson {
  id: string;
  name: string;
  room?: string;
  start_hour?: number;
  duration?: number;
  user_id?: string;
}

export interface ChartItem {
  type: string;
  title: string;
  description?: string;
  data: Record<string, unknown>[];
}
