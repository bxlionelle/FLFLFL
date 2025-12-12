import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AvatarTextComponent } from '../../../ui/avatar/avatar-text.component';
import { CheckboxComponent } from '../../../form/input/checkbox.component';
import { AuthService } from '../../../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-basic-table-two',
  standalone: true,
  imports: [
    CommonModule,
    AvatarTextComponent,
    CheckboxComponent,
  ],
  templateUrl: './basic-table-two.component.html',
  styles: ``
})
export class BasicTableTwoComponent implements OnInit {
  projects: any[] = [];
  currentUser: any = null;
  userRole: string | null = null;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserAndProjects();
  }

  loadUserAndProjects(): void {
    // Get current user and their role
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userRole = this.authService.getUserRole();
        this.loadProjects();
      }
    });
  }

  loadProjects(): void {
    this.isLoading = true;
    const apiUrl = environment.apiUrl;

    // Fetch projects based on user role
    this.http.get<any>(`${apiUrl}/projects`).subscribe({
      next: (response) => {
        console.log('Projects response:', response);
        
        // Filter projects based on user role
        this.projects = this.filterProjectsByRole(response.data || response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoading = false;
        // Use test data if API fails
        this.useTestData();
      }
    });
  }

  filterProjectsByRole(allProjects: any[]): any[] {
    if (!this.currentUser || !allProjects) return [];

    switch (this.userRole?.toLowerCase()) {
      case 'member':
        // Show only projects where the user is assigned as a team member
        return allProjects.filter(project => 
          project.team_members?.some((member: any) => member.id === this.currentUser.id) ||
          project.members?.some((member: any) => member.id === this.currentUser.id)
        );

      case 'project_manager':
        // Show only projects created by this project manager
        return allProjects.filter(project => 
          project.created_by === this.currentUser.id ||
          project.manager_id === this.currentUser.id
        );

      case 'client':
        // Show only projects where this user is the client
        return allProjects.filter(project => 
          project.client_id === this.currentUser.id
        );

      case 'administrator':
        // Admins see all projects
        return allProjects;

      default:
        return [];
    }
  }

  useTestData(): void {
    // Test data for different roles
    const testProjects = [
      {
        id: 1,
        name: 'E-commerce Platform',
        status: 'On Track',
        progress: 65,
        client: { name: 'ABC Corp', email: 'contact@abc.com' },
        team_members: [
          { id: 1, name: 'John Doe', avatar: 'JD' },
          { id: 2, name: 'Jane Smith', avatar: 'JS' }
        ],
        deadline: '2024-12-31',
        created_by: 1
      },
      {
        id: 2,
        name: 'Mobile App Development',
        status: 'At Risk',
        progress: 45,
        client: { name: 'XYZ Ltd', email: 'info@xyz.com' },
        team_members: [
          { id: 2, name: 'Jane Smith', avatar: 'JS' }
        ],
        deadline: '2024-11-30',
        created_by: 1
      },
      {
        id: 3,
        name: 'Website Redesign',
        status: 'Completed',
        progress: 100,
        client: { name: 'Tech Solutions', email: 'hello@techsol.com' },
        team_members: [
          { id: 1, name: 'John Doe', avatar: 'JD' }
        ],
        deadline: '2024-10-15',
        created_by: 2
      }
    ];

    this.projects = this.filterProjectsByRole(testProjects);
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('track') || statusLower.includes('complete')) {
      return 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    }
    if (statusLower.includes('risk') || statusLower.includes('delay')) {
      return 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
  }

  getRoleName(): string {
    switch (this.userRole?.toLowerCase()) {
      case 'member':
        return 'Team Member';
      case 'project_manager':
        return 'Project Manager';
      case 'client':
        return 'Client';
      case 'administrator':
        return 'Administrator';
      default:
        return 'User';
    }
  }
}