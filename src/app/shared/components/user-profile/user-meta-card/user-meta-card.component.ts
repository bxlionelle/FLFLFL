import { Component, OnInit } from '@angular/core';
import { InputFieldComponent } from './../../form/input/input-field.component';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-meta-card',
  imports: [
    CommonModule,
    ModalComponent,
    InputFieldComponent,
    ButtonComponent,
    FormsModule,
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent implements OnInit {
  currentUser: any = null;
  editUser: any = {};
  isOpen = false;

  constructor(
    public modal: ModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    // Get the current user from AuthService
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
      }
    });

    // Alternative: If you store user in localStorage
    // const userStr = localStorage.getItem('currentUser');
    // if (userStr) {
    //   this.currentUser = JSON.parse(userStr);
    // }
  }

  openModal(): void {
    // Create a copy of current user for editing
    this.editUser = { ...this.currentUser };
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
    this.editUser = {};
  }

  handleSave(): void {
    // Update the current user with edited values
    if (this.editUser) {
      // Update via AuthService or API
      this.authService.updateUserProfile(this.editUser).subscribe({
        next: (response) => {
          console.log('Profile updated successfully', response);
          // Laravel returns { success: true, user: {...} }
          this.currentUser = response.user;
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          // Handle error (show toast notification, etc.)
        }
      });
    }
  }
}