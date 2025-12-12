import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';


// --- Data Interfaces ---
export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done'; 
  priority: 'Low' | 'Medium' | 'High';
  start_date: string;
  due_date: string;
  assigned_user_id: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  progress: number;
  team_size: number;
  due_date: string;
  tasks: Task[];
}

export interface User {
  id: number;
  name: string;
  firstName: string;
  role: string;
}


// --- Service Stubs ---
class ProjectServiceStub {
  private apiUrl = 'http://localhost:8000/api/projects'; 
  private taskApiUrl = 'http://localhost:8000/api/tasks'; 

  constructor(private http: HttpClient) {}

  getAllProjectsWithTasks(): Observable<Project[]> {
    return this.http.get<{ data: Project[] }>(`${this.apiUrl}?with_tasks=true`).pipe(
        map((response: { data: Project[] }) => response.data) // Added explicit type for map callback
    ); 
  }

  updateProject(id: number, data: { progress: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  updateTask(id: number, data: { status?: Task['status'], start_date?: string, due_date?: string }): Observable<any> {
    return this.http.put(`${this.taskApiUrl}/${id}`, data);
  }
}

class AuthServiceStub {
  private apiUrl = 'http://localhost:8000/api/user';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(this.apiUrl);
  }
}


// --- Main Component ---
@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    HttpClientModule,
  ],
  templateUrl: './project-management.component.html',
  styles: ``
})
export class ProjectManagementComponent implements OnInit {

  currentUser: User | null = null;
  allProjects: Project[] = [];
  tasks: Task[] = [];
  isLoading = true; 
  hasError = false;

  stats = {
    activeProjects: 0,
    myTasks: 0,
    inProgress: 0,
    completed: 0
  };

  upcomingDeadlines: Task[] = [];
  projectProgress: Project[] = [];

  private projectService: ProjectServiceStub;
  private authService: AuthServiceStub;

  constructor(private http: HttpClient) {
    this.projectService = new ProjectServiceStub(http);
    this.authService = new AuthServiceStub(http);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    forkJoin({
      user: this.authService.getCurrentUser(),
      projects: this.projectService.getAllProjectsWithTasks()
    }).subscribe({
      next: (results) => {
        this.currentUser = results.user;
        this.allProjects = results.projects;
        this.tasks = this.allProjects.flatMap(p => p.tasks); 

        this.calculateDashboardStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  calculateDashboardStats(): void {
    if (!this.currentUser) return;

    this.stats.activeProjects = this.allProjects.filter(p => p.progress < 100).length;
    this.stats.completed = this.tasks.filter(t => t.status === 'Done').length;
    this.stats.inProgress = this.tasks.filter(t => t.status === 'In Progress').length;
    
    this.stats.myTasks = this.tasks.filter(
      t => t.assigned_user_id === this.currentUser!.id && t.status !== 'Done'
    ).length;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    this.upcomingDeadlines = this.tasks
      .filter(t => new Date(t.due_date) < thirtyDaysFromNow && new Date(t.due_date) >= today && t.status !== 'Done')
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority]; 
        }
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })
      .slice(0, 5); 
      
    this.projectProgress = this.allProjects.filter(p => p.progress < 100);
  }

  getKanbanData(): { [key: string]: Task[] } {
      const statuses: ('To Do' | 'In Progress' | 'In Review' | 'Done')[] = ['To Do', 'In Progress', 'In Review', 'Done'];
      const groups: { [key: string]: Task[] } = statuses.reduce((acc, status) => ({ ...acc, [status]: [] }), {});

      return this.tasks.reduce((acc, task) => {
          if (statuses.includes(task.status)) {
              acc[task.status].push(task);
          }
          return acc;
      }, groups);
  }

  getGanttData(): any[] {
    return this.allProjects.flatMap(project => project.tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: task.start_date,
      end: task.due_date,
      progress: task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0,
      group: project.name, 
    })));
  }

  viewDeadlineDetails(task: Task) {
    console.log('Viewing deadline:', task);
    alert(`Task: ${task.title}\nProject ID: ${task.project_id}\nDue: ${task.due_date}`);
  }

  viewProjectDetails(project: Project) {
    console.log('Viewing project:', project);
    alert(`Project: ${project.name}\nProgress: ${project.progress}%\nTeam: ${project.team_size} members\nDue: ${project.due_date}`);
  }

  updateProjectProgress(project: Project, newProgress: number) {
    this.projectService.updateProject(project.id, { progress: newProgress }).subscribe({
      next: () => {
        project.progress = newProgress;
        console.log(`Updated ${project.name} progress to ${newProgress}% in UI and API.`);
      },
      error: (err) => console.error('API Update failed:', err)
    });
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  // --- FIXED: MOVED INSIDE THE CLASS ---
  addProject(): void {
    if (this.currentUser?.role === 'administrator' || this.currentUser?.role === 'project_manager') {
      console.log('Action: Launch Add New Project Form/Modal');
      alert('Implement: Launch Add Project Form');
    } else {
      alert('Authorization required to add a project.');
    }
  }

  addMember(): void {
    if (this.currentUser?.role === 'administrator') {
      console.log('Action: Launch Add New Team Member Form/Modal');
      alert('Implement: Launch Add Member Form');
    } else {
      alert('Authorization required to add a member.');
    }
  }
}