// team-members.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  progress: number;
  assignee: string;
  tags: string[];
  status: 'toDo' | 'inProgress' | 'inReview' | 'completed';
}

interface GanttTask {
  id: number;
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

interface User {
  name: string;
  role: string;
}

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule
  ],
  templateUrl: './team-members.component.html',
  styles: ``
})
export class TeamMemberComponent {
  // Current User Information
  currentUser: User = {
    name: 'Mike Johnson',
    role: 'Team Member'
  };

  // View state
  currentView: 'kanban' | 'gantt' = 'kanban';

  // Kanban Board Columns
  columns = {
    toDo: [
      {
        id: 'task-1',
        title: 'Database design',
        description: 'Design and implement database schema',
        priority: 'High',
        progress: 0,
        assignee: 'JC',
        tags: ['Database', 'Backend'],
        status: 'toDo' as const
      },
      {
        id: 'task-2',
        title: 'Performance optimization',
        description: 'Optimize loading times and bundle size',
        priority: 'Medium',
        progress: 0,
        assignee: 'MJ',
        tags: ['Performance'],
        status: 'toDo' as const
      }
    ] as Task[],

    inProgress: [
      {
        id: 'task-3',
        title: 'Frontend development',
        description: 'Implement responsive homepage...',
        priority: 'High',
        progress: 70,
        assignee: 'MI',
        tags: ['Development', 'Frontend'],
        status: 'inProgress' as const
      },
      {
        id: 'task-4',
        title: 'API Integration Testing',
        description: 'Test all API endpoints',
        priority: 'Medium',
        progress: 45,
        assignee: 'JO',
        tags: ['Testing'],
        status: 'inProgress' as const
      }
    ] as Task[],

    inReview: [
      {
        id: 'task-5',
        title: 'User Authentication',
        description: 'Implement OAuth and JWT authentication',
        priority: 'High',
        progress: 90,
        assignee: 'SW',
        tags: ['Security', 'Backend'],
        status: 'inReview' as const
      }
    ] as Task[],

    completed: [
      {
        id: 'task-6',
        title: 'Design mockups',
        description: 'Create high-fidelity mockups for the...',
        priority: 'High',
        progress: 100,
        assignee: 'JC',
        tags: ['Design', 'UI/UX'],
        status: 'completed' as const
      }
    ] as Task[]
  };

  // Gantt Chart Data - Linked to Kanban tasks
  ganttTasks: GanttTask[] = [
    {
      id: 1,
      title: 'Design mockups',
      assignee: 'Jane Collin',
      priority: 'High',
      status: 'Completed',
      progress: 100,
      startDate: '2025-01-15',
      endDate: '2025-02-10',
      duration: 26
    },
    {
      id: 2,
      title: 'Frontend development',
      assignee: 'Mike Johnson',
      priority: 'High',
      status: 'In Progress',
      progress: 70,
      startDate: '2025-02-01',
      endDate: '2025-04-15',
      duration: 73
    },
    {
      id: 3,
      title: 'API Integration Testing',
      assignee: 'Jake Owen',
      priority: 'Medium',
      status: 'In Progress',
      progress: 45,
      startDate: '2025-03-01',
      endDate: '2025-04-05',
      duration: 35
    },
    {
      id: 4,
      title: 'Database design',
      assignee: 'Jake Chen',
      priority: 'High',
      status: 'To Do',
      progress: 0,
      startDate: '2025-03-15',
      endDate: '2025-05-30',
      duration: 76
    },
    {
      id: 5,
      title: 'User Authentication',
      assignee: 'Sarah Williams',
      priority: 'High',
      status: 'In Review',
      progress: 90,
      startDate: '2025-03-10',
      endDate: '2025-04-20',
      duration: 41
    },
    {
      id: 6,
      title: 'Performance optimization',
      assignee: 'Mike Johnson',
      priority: 'Medium',
      status: 'To Do',
      progress: 0,
      startDate: '2025-04-20',
      endDate: '2025-05-15',
      duration: 25
    }
  ];

  months: Month[] = [];
  chartStart: Date = new Date('2025-01-01');
  chartEnd: Date = new Date('2025-06-30');

  constructor() {
    console.log('Component loaded');
    this.generateMonths();
  }

  // View switching methods
  switchToKanban(): void {
    this.currentView = 'kanban';
  }

  switchToGantt(): void {
    this.currentView = 'gantt';
  }

  // Drag and Drop Handler
  drop(event: CdkDragDrop<Task[]>, targetColumn: 'toDo' | 'inProgress' | 'inReview' | 'completed'): void {
    if (event.previousContainer === event.container) {
      // Reorder within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Move to a different column
      const task = event.previousContainer.data[event.previousIndex];
      
      // Update task status
      task.status = targetColumn;
      
      // Auto-update progress based on column
      switch (targetColumn) {
        case 'toDo':
          task.progress = 0;
          break;
        case 'inProgress':
          task.progress = task.progress === 0 ? 50 : task.progress;
          break;
        case 'inReview':
          task.progress = task.progress < 80 ? 80 : task.progress;
          break;
        case 'completed':
          task.progress = 100;
          break;
      }

      // Transfer the item between arrays
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update Gantt chart to reflect the changes
      this.syncTaskToGantt(task, targetColumn);

      console.log(`Moved task "${task.title}" to ${targetColumn}`);
    }
  }

  // Sync Kanban task changes to Gantt chart
  syncTaskToGantt(task: Task, newStatus: string): void {
    // Find corresponding Gantt task by title
    const ganttTask = this.ganttTasks.find(gt => 
      gt.title.toLowerCase() === task.title.toLowerCase() || 
      gt.title.toLowerCase().includes(task.title.toLowerCase().substring(0, 15))
    );

    if (ganttTask) {
      // Update Gantt task status
      ganttTask.progress = task.progress;
      
      // Map Kanban status to Gantt status
      switch (newStatus) {
        case 'toDo':
          ganttTask.status = 'To Do';
          break;
        case 'inProgress':
          ganttTask.status = 'In Progress';
          break;
        case 'inReview':
          ganttTask.status = 'In Review';
          break;
        case 'completed':
          ganttTask.status = 'Completed';
          break;
      }

      console.log(`Synced Gantt task: ${ganttTask.title} to status ${ganttTask.status}`);
    }
  }

  // Gantt Chart Methods
  generateMonths(): void {
    this.months = [];
    const startDate = new Date('2025-01-01');
    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      this.months.push({
        name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: date
      });
    }
  }

  calculateBarPosition(startDate: string, endDate: string): { left: string; width: string } {
    const totalDays = (this.chartEnd.getTime() - this.chartStart.getTime()) / (1000 * 60 * 60 * 24);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startOffset = (start.getTime() - this.chartStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { 
      left: `${left}%`, 
      width: `${width}%` 
    };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'In Review':
        return 'bg-yellow-500';
      case 'To Do':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  }

  getPriorityClass(priority: string): string {
    return priority === 'High' 
      ? 'bg-red-500 text-white' 
      : 'bg-gray-800 text-white dark:bg-gray-700';
  }

  getRowClass(index: number): string {
    return index % 2 === 0 
      ? 'bg-white dark:bg-transparent' 
      : 'bg-gray-50/50 dark:bg-gray-800/20';
  }

  // Kanban Board Methods
  viewTaskDetails(task: Task): void {
    console.log('Viewing task:', task);
    alert(`Task: ${task.title}\nDescription: ${task.description}\nProgress: ${task.progress}%\nStatus: ${task.status}`);
  }

  addNewTask(column: 'toDo' | 'inProgress' | 'inReview' | 'completed'): void {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: 'Task description',
      priority: 'Medium',
      progress: 0,
      assignee: this.currentUser.name,
      tags: ['New'],
      status: column
    };
    
    this.columns[column].push(newTask);
    console.log(`Added new task to ${column}`);
  }
}