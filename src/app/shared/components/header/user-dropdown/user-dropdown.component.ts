import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../../app/services/auth.service'; 
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../../../../app/models/user.model';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

    logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/signin']); 
      },
      error: (err) => {
        console.error('Logout failed', err);
        (this.authService as any).clearUserData();
        this.router.navigate(['/signin']);
      }
    });
  }
}