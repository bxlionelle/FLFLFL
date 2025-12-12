// src/app/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  assignee: string;
  tags: string[];
  status: 'toDo' | 'inProgress' | 'inReview' | 'completed';
  start_date: string;
  end_date: string;
  project_id?: number;
  assigned_user_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      map(tasks => tasks.map(task => this.mapTaskFromLaravel(task)))
    );
  }

  getTaskById(taskId: string): Observable<Task> {
    return this.http.get<any>(`${this.apiUrl}/${taskId}`).pipe(
      map(task => this.mapTaskFromLaravel(task))
    );
  }

  createTask(taskData: Partial<Task>): Observable<Task> {
    const payload = {
      ...taskData,
      status: this.mapStatusToLaravel(taskData.status!),
      due_date: taskData.end_date
    };
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(task => this.mapTaskFromLaravel(task))
    );
  }

  updateTask(taskId: string, taskData: Partial<Task>): Observable<Task> {
    const payload: any = { ...taskData };
    if (taskData.status) payload.status = this.mapStatusToLaravel(taskData.status);
    if (taskData.end_date) payload.due_date = taskData.end_date;

    return this.http.put<any>(`${this.apiUrl}/${taskId}`, payload).pipe(
      map(task => this.mapTaskFromLaravel(task))
    );
  }

  updateTaskStatus(taskId: string, status: string, progress: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}`, {
      status: this.mapStatusToLaravel(status),
      progress: progress
    });
  }

  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${taskId}`);
  }

  // ---- Helper functions ----
  private mapTaskFromLaravel(task: any): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      progress: task.progress || 0,
      assignee: task.assignee || task.assigned_user?.name || 'Unassigned',
      tags: task.tags || [],
      status: this.mapStatusFromLaravel(task.status),
      start_date: task.start_date,
      end_date: task.due_date || task.end_date,
      project_id: task.project_id,
      assigned_user_id: task.assigned_user_id
    };
  }

  private mapStatusFromLaravel(status: string): 'toDo' | 'inProgress' | 'inReview' | 'completed' {
    const map: any = {
      'To Do': 'toDo',
      'In Progress': 'inProgress',
      'In Review': 'inReview',
      'Done': 'completed',
      'Completed': 'completed'
    };
    return map[status] || 'toDo';
  }

  private mapStatusToLaravel(status: string): string {
    const map: any = {
      'toDo': 'To Do',
      'inProgress': 'In Progress',
      'inReview': 'In Review',
      'completed': 'Done'
    };
    return map[status] || status;
  }
}
