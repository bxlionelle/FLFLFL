// src/app/pages/team-members/team-members.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ProjectService, Project, User } from '../../services/project.service';
import { TaskService, Task } from '../../services/task.service';
import { catchError, forkJoin, finalize, of } from 'rxjs';

interface GanttTask {
  id: number | string;
  title: string;
  assignee: string;
  priority: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  duration: number;
}

interface Month {
  name: string;
  date: Date;
}

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './team-members.component.html',
})
export class TeamMembersComponent implements OnInit {
  // ========================================================================
  // STATE
  // ========================================================================

  isLoading = true;
  loadingError: string | null = null;

  currentUser: User = { id: 0, name: 'Loading...', email: '', role: '' };
  allTasks: Task[] = [];
  allProjects: Project[] = [];
  allUsers: User[] = [];

  columns: Record<'toDo' | 'inProgress' | 'inReview' | 'completed', Task[]> = {
    toDo: [],
    inProgress: [],
    inReview: [],
    completed: [],
  };

  ganttTasks: GanttTask[] = [];
  currentView: 'kanban' | 'gantt' = 'kanban';

  months: Month[] = [];
  chartStart: Date = new Date('2025-01-01');
  chartEnd: Date = new Date('2025-06-30');

  // Modal states
  showProjectModal = false;
  showTaskModal = false;

  // Form data
  newProject: Partial<Project> = this.getDefaultProject();
  newTask: Partial<Task> = this.getDefaultTask();

  // Enums aligned with TaskController
  private readonly allowedStatuses: Array<'toDo' | 'inProgress' | 'inReview' | 'completed'> =
    ['toDo', 'inProgress', 'inReview', 'completed'];
  private readonly allowedPriorities: Array<'Low' | 'Medium' | 'High'> =
    ['Low', 'Medium', 'High'];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService
  ) {
    this.generateMonths();
  }

  ngOnInit(): void {
    console.log('TeamMembersComponent init');
    this.loadDashboardData();
  }

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadingError = null;

    forkJoin({
      user: this.projectService.getCurrentUser().pipe(
        catchError((err) => {
          console.error('Error loading current user:', err);
          this.loadingError =
            'Authentication Error: Could not load user data. Please log in.';
          return of(null);
        })
      ),
      tasks: this.taskService.getAllTasks().pipe(
        catchError((err) => {
          console.error('Error loading tasks:', err);
          if (!this.loadingError) {
            this.loadingError = 'Error loading task data from API.';
          }
          return of([] as Task[]);
        })
      ),
      projects: this.projectService.getAllProjects().pipe(
        catchError((err) => {
          console.error('Error loading projects:', err);
          return of([] as Project[]);
        })
      ),
      users: this.projectService.getAllUsers().pipe(
        catchError((err) => {
          console.error('Error loading users:', err);
          if (!this.loadingError) {
            this.loadingError = 'Error loading user data (forbidden).';
          }
          return of([] as User[]);
        })
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (result) => {
          const { user, tasks, projects, users } = result;

          if (user) {
            this.currentUser = user;
          }

          this.allTasks = tasks || [];
          this.processData(this.allTasks);

          this.allProjects = projects || [];
          this.allUsers = users || [];

          console.log('Dashboard loaded:', {
            currentUser: this.currentUser,
            tasksCount: this.allTasks.length,
            projectsCount: this.allProjects.length,
            usersCount: this.allUsers.length,
          });
        },
        error: (err) => {
          console.error('Unexpected error in dashboard load:', err);
          if (!this.loadingError) {
            this.loadingError = 'An unexpected network error occurred.';
          }
        },
      });
  }

  // ========================================================================
  // DEFAULT FORM VALUES
  // ========================================================================

  private getDefaultProject(): Partial<Project> {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    return {
      name: '',
      description: '',
      status: 'active',
      start_date: today.toISOString().split('T')[0],
      end_date: threeMonthsLater.toISOString().split('T')[0],
      budget: 0,
    };
  }

  private getDefaultTask(): Partial<Task> {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'toDo',
      progress: 0,
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      tags: [],
    };
  }

  // ========================================================================
  // MODAL CONTROL
  // ========================================================================

  openProjectModal(): void {
    if (this.currentUser.role !== 'client') {
      this.newProject = this.getDefaultProject();
      this.showProjectModal = true;
    }
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
    this.newProject = this.getDefaultProject();
  }

  openTaskModal(): void {
    if (this.currentUser.role !== 'client') {
      this.newTask = this.getDefaultTask();
      this.showTaskModal = true;
    }
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.newTask = this.getDefaultTask();
  }

  // ========================================================================
  // PROJECT CRUD
  // ========================================================================

  submitProject(): void {
    if (!this.newProject.name || !this.newProject.start_date) {
      alert('Please fill in all required fields (name and start date).');
      return;
    }

    const payload: any = {
      name: this.newProject.name,
      description: this.newProject.description ?? '',
      status: this.newProject.status ?? 'active',
      progress: this.newProject.progress ?? 0,
      start_date: this.newProject.start_date,
      end_date: this.newProject.end_date ?? null,
      due_date: this.newProject.end_date ?? null,
      budget: this.newProject.budget ?? 0,
      manager_id: this.currentUser.id,
      client_id: this.newProject.client_id ?? null,
      team_members: this.newProject.team_members ?? [],
    };

    this.projectService.createProject(payload as Project).subscribe({
      next: (res: any) => {
        const project = res.project ?? res;
        console.log('Project created:', project);
        this.allProjects.push(project);
        this.closeProjectModal();
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        console.error('Validation errors from API:', err.error);
        alert('Failed to create project. Please check required fields in the form.');
      },
    });
  }

  // ========================================================================
  // TASK CRUD
  // ========================================================================

  submitTask(): void {
    if (
      !this.newTask.title ||
      !this.newTask.project_id ||
      !this.newTask.assigned_user_id ||
      !this.newTask.start_date ||
      !this.newTask.end_date
    ) {
      alert(
        'Please fill in all required fields (title, project, assignee, dates, status, priority).'
      );
      return;
    }

    // Normalize status and priority against backend enums
    let status = (this.newTask.status as string) || 'toDo';
    if (!this.allowedStatuses.includes(status as any)) {
      status = 'toDo';
    }

    let priority = (this.newTask.priority as string) || 'Medium';
    if (!this.allowedPriorities.includes(priority as any)) {
      priority = 'Medium';
    }

    const payload: any = {
      project_id: Number(this.newTask.project_id),
      title: this.newTask.title,
      description: this.newTask.description ?? '',
      status,
      priority,
      start_date: this.newTask.start_date,
      end_date: this.newTask.end_date,
      assigned_user_id: Number(this.newTask.assigned_user_id),
      progress: this.newTask.progress ?? 0,
    };

    console.log('TASK PAYLOAD >>>', payload);

    this.taskService.createTask(payload as Task).subscribe({
      next: (task) => {
        console.log('Task created:', task);
        this.allTasks.push(task);
        this.processData(this.allTasks);
        this.closeTaskModal();
      },
      error: (err) => {
        console.error('Failed to create task:', err);
        console.error('Task validation errors:', err.error);
        alert(
          'Failed to create task. Please check required fields (title, project, assignee, dates, status, priority).'
        );
      },
    });
  }

  // ========================================================================
  // DATA PROCESSING
  // ========================================================================

  private processData(tasks: Task[]): void {
    this.columns = { toDo: [], inProgress: [], inReview: [], completed: [] };
    this.ganttTasks = [];

    tasks.forEach((task) => {
      if (this.columns[task.status]) {
        this.columns[task.status].push(task);
      }

      if (task.start_date && task.end_date) {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);
        const duration = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );

        this.ganttTasks.push({
          id: task.id,
          title: task.title,
          assignee : (task as any).assignee ?? '',
          priority: task.priority,
          status: this.mapStatusForGantt(task.status),
          progress: task.progress,
          startDate: task.start_date,
          endDate: task.end_date,
          duration,
        });
      }
    });
  }

  private mapStatusForGantt(
    status: 'toDo' | 'inProgress' | 'inReview' | 'completed'
  ): string {
    switch (status) {
      case 'toDo':
        return 'To Do';
      case 'inProgress':
        return 'In Progress';
      case 'inReview':
        return 'In Review';
      case 'completed':
        return 'Completed';
    }
  }

  // ========================================================================
  // VIEW SWITCHING
  // ========================================================================

  switchToKanban(): void {
    this.currentView = 'kanban';
  }

  switchToGantt(): void {
    this.currentView = 'gantt';
  }

  // ========================================================================
  // KANBAN DRAG & DROP
  // ========================================================================

  drop(
    event: CdkDragDrop<Task[]>,
    targetStatus: 'toDo' | 'inProgress' | 'inReview' | 'completed'
  ): void {
    if (this.currentUser.role === 'client') return;

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      let newProgress = task.progress;

      switch (targetStatus) {
        case 'toDo':
          newProgress = 0;
          break;
        case 'inProgress':
          newProgress = newProgress === 0 ? 50 : newProgress;
          break;
        case 'inReview':
          newProgress = newProgress < 80 ? 80 : newProgress;
          break;
        case 'completed':
          newProgress = 100;
          break;
      }

      task.status = targetStatus;
      task.progress = newProgress;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.taskService
        .updateTaskStatus(task.id, targetStatus, newProgress)
        .subscribe({
          next: () =>
            console.log(`Updated task ${task.id} status to ${targetStatus}`),
          error: (err) => console.error('Failed to update task:', err),
        });
    }
  }

  // ========================================================================
  // GANTT HELPERS
  // ========================================================================

  generateMonths(): void {
    this.months = [];
    const startDate = new Date(this.chartStart);

    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      this.months.push({
        name: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        date,
      });
    }
  }

  calculateBarPosition(
    startDate: string,
    endDate: string
  ): { left: string; width: string } {
    const totalDays =
      (this.chartEnd.getTime() - this.chartStart.getTime()) /
      (1000 * 60 * 60 * 24);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const left =
      ((start.getTime() - this.chartStart.getTime()) /
        (1000 * 60 * 60 * 24)) /
      totalDays *
      100;

    const width =
      ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) /
      totalDays *
      100;

    return { left: `${left}%`, width: `${width}%` };
  }
}
