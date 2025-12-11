import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { UserListComponent } from './pages/users/user-list/user-list.component.component';
import { RolesComponent } from './pages/roles/roles.component';
import { PermissionComponent } from './pages/permissions/permission/permission.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { authGuard } from './services/auth.guard';
import { TeamMemberComponent } from './pages/team-members/team-members.component'; // <--- ADD THIS LINE
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { ProjectManagementComponent } from './pages/project-management/project-management.component';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate:[authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'FlowTrack - Checche',
      },
      {
        path: 'task',
        component: TeamMemberComponent,
        title: 'FlowTrack - Task Management',
      },
      
      {
        path:'permissions',
        component: PermissionComponent,
        title: 'FlowTrack - Checche',
      },

      {
        path: 'expenses', 
        component: ExpensesComponent,
        title: 'FlowTrack - Expenses',
      },

      {
        path: 'project-management',
        component: ProjectManagementComponent,
        title: 'FlowTrack - Projects',
      },
      
      
      {
        path:'roles',
        component:RolesComponent,
        title: 'FlowTrack - Checche',
      },
      {
        path:'users',
        component:UserListComponent,
        title: 'FlowTrack - Checche',
      },
      {
        path:'profile',
        component:ProfileComponent,
        title: 'FlowTrack - Checche',
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title: 'FlowTrack - Checche',
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title: 'FlowTrack - Checche',
      },
    ]
  },
  {
    path:'signin',
    component:SignInComponent,
    title:'Checheche'
  },
];
