import { Component, OnInit } from '@angular/core';
import { InputFieldComponent } from './../../form/input/input-field.component';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-meta-card',
  imports: [
    CommonModule,
    ModalComponent,
    InputFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent implements OnInit {
  constructor(
    public modal: ModalService,
    private authService: AuthService // Inject your auth service
  ) {}

  isOpen = false;
  user: any = null; // Will hold the current user data
  loading = true;

  ngOnInit() {
    // Get the current logged-in user
    this.authService.currentUser$.subscribe({
      next: (userData) => {
        if (userData) {
          this.user = {
            firstName: userData.firstName || userData.first_name || '',
            lastName: userData.lastName || userData.last_name || '',
            role: userData.role || 'User',
            location: userData.location || '',
            avatar: userData.avatar || userData.profileImage || '/assets/images/default-avatar.png',
             //social: {
              facebook: userData.social?.facebook || userData.facebookUrl || '',
              x: userData.social?.x || userData.twitterUrl || '',
              linkedin: userData.social?.linkedin || userData.linkedinUrl || '',
              instagram: userData.social?.instagram || userData.instagramUrl || '',
            //},
            email: userData.email || '',
            phone: userData.phone || userData.phoneNumber || '',
            bio: userData.bio || userData.description || '',
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        this.loading = false;
      }
    });
  }

  openModal() { 
    this.isOpen = true; 
  }

  closeModal() { 
    this.isOpen = false; 
  }

  handleSave() {
    // Handle save logic here - update user in backend
    console.log('Saving changes...', this.user);
    
    this.authService.updateUserProfile(this.user).subscribe({
      next: (response) => {
        console.log('Profile updated successfully');
        this.closeModal();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
      }
    });
  }
}