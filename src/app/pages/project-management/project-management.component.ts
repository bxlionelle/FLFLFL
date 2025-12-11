import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

interface Deadline {
  title: string;
  subtitle: string;
  priority: string;
  date: string;
}

interface Project {
  name: string;
  progress: number;
  teamSize: number;
  dueDate: string;
}

interface User {
  name: string;
  firstName: string;
  role: string;
}

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,  // Uncomment when you have the correct path
  ],
  templateUrl: './project-management.component.html',
  styles: ``
})
export class ProjectManagementComponent {
  // Current User Information
  currentUser: User = {
    name: 'Mike Johnson',
    firstName: 'Mike Johnson',
    role: 'Team Member'
  };

  // Dashboard Statistics
  stats = {
    activeProjects: 2,
    myTasks: 2,
    inProgress: 1,
    completed: 0
  };

  // Upcoming Deadlines
  upcomingDeadlines: Deadline[] = [
    {
      title: 'Frontend development',
      subtitle: 'Website Redesign',
      priority: 'High',
      date: '3/15/2025'
    }
  ];

  // Project Progress
  projectProgress: Project[] = [
    {
      name: 'Website Redesign',
      progress: 65,
      teamSize: 3,
      dueDate: '6/30/2025'
    },
    {
      name: 'Mobile App Development',
      progress: 40,
      teamSize: 3,
      dueDate: '8/31/2025'
    }
  ];

  constructor() {
    console.log('Project Management Dashboard loaded');
  }

  // View deadline details
  viewDeadlineDetails(deadline: Deadline) {
    console.log('Viewing deadline:', deadline);
    alert(`Task: ${deadline.title}\nProject: ${deadline.subtitle}\nDue: ${deadline.date}`);
  }

  // View project details
  viewProjectDetails(project: Project) {
    console.log('Viewing project:', project);
    alert(`Project: ${project.name}\nProgress: ${project.progress}%\nTeam: ${project.teamSize} members\nDue: ${project.dueDate}`);
  }

  // Update project progress
  updateProjectProgress(project: Project, newProgress: number) {
    project.progress = newProgress;
    console.log(`Updated ${project.name} progress to ${newProgress}%`);
  }

  // Refresh dashboard data
  refreshDashboard() {
    console.log('Refreshing dashboard data...');
    // Add your refresh logic here
  }
}