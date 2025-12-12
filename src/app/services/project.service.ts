// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  progress?: number;
  start_date: string;
  end_date: string;
  budget?: number;
  manager_id?: number;
  client_id?: number;
  created_by?: number;
  tasks?: any[];
  team_members?: any[];
  team_size?: number;
}

export interface User {
  id: number;
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getAllProjects(): Observable<Project[]> {
    return this.http.get<{ data: Project[] }>(`${this.apiUrl}/projects?with_tasks=true`).pipe(
      map(response => response.data || [])
    );
  }

  getProjectById(projectId: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${projectId}`);
  }

  createProject(projectData: Partial<Project>): Observable<Project> {
    return this.http.post<{ project: Project }>(`${this.apiUrl}/projects`, projectData).pipe(
      map(res => res.project)
    );
  }

  updateProject(projectId: number, projectData: Partial<Project>): Observable<Project> {
    return this.http.put<{ project: Project }>(`${this.apiUrl}/projects/${projectId}`, projectData).pipe(
      map(res => res.project)
    );
  }

  deleteProject(projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${projectId}`);
  }

  // ---- Users ----
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`).pipe(
      map(user => ({
        ...user,
        name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim()
      }))
    );
  }


  getAllUsers(): Observable<User[]> {
    const token = localStorage.getItem('access_token'); // Must match key saved on login
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<{ data: User[] }>(`${this.apiUrl}/users`, { headers }).pipe(
      map(res => res.data || [])
    );
  }
}
