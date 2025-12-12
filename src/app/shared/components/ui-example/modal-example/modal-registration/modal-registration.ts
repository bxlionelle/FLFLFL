  import { CommonModule } from '@angular/common';
  import { Component, OnInit } from '@angular/core';
  import { ModalComponent } from '../../../ui/modal/modal.component';
  import { ButtonComponent } from '../../../ui/button/button.component';
  import { LabelComponent } from '../../../form/label/label.component';
  import { InputFieldComponent } from '../../../form/input/input-field.component';
  import { AuthService } from '../../../../../services/auth.service';
  import { RoleService } from '../../../../../services/role.service';
  import { User, Role } from '../../../../../models/user.model';
  import { FormsModule } from '@angular/forms';


  @Component({
    selector: 'modal-registration',
    imports: [
      CommonModule,
      ModalComponent,
      FormsModule,
      ButtonComponent,
      LabelComponent,
      InputFieldComponent,
    ],
    templateUrl: './modal-registration.html',
    styles: ``
  })

  export class ModalRegistration implements OnInit {

    firstname = '';
    middlename: string | null = null;
    lastname = '';
    email = '';
    address: string | null = null;
    bio: string | null = null;
    selectedRoleId: number | null = null;
    roles: Role[] = [];
    password = '';
    password_confirmation = ''; 

    constructor(
      private authService: AuthService,
      private roleService: RoleService
    ) {}

    ngOnInit() {
      this.loadRoles();
    }

    loadRoles() {
      this.roleService.getRoles().subscribe({
        next: (roles) => {
          this.roles = roles;
          console.log('Roles loaded:', roles);
        },
        error: (error) => {
          console.error('Failed to load roles', error);
        }
      });
    }

    isOpen = false;

    openModal() {
      this.isOpen = true;
    }

    closeModal() {
      this.isOpen = false;
    }

    handleSave() {
      const payload = {
        firstname: this.firstname,
        middlename: this.middlename,
        lastname: this.lastname,
        email: this.email,
        address: this.address,
        bio: this.bio,
        role_id: this.selectedRoleId!,
        is_active: true,
        password: this.password,
        password_confirmation: this.password_confirmation 
      };

      console.log('Payload being sent:', payload);

      this.authService.register(payload).subscribe({
        next: (response) => {
          console.log('User registered successfully', response);
          this.closeModal();
          this.resetForm();
        },
        error: (error) => {
          console.error('Registration failed', error);
          // Display validation errors if available
          if (error.error && error.error.errors) {
            console.error('Validation errors:', error.error.errors);
            const errorMessages = Object.values(error.error.errors).flat().join('\n');
            alert('Registration failed:\n' + errorMessages);
          } else {
            alert('Registration failed: ' + (error.error.message || 'Unknown error'));
          }
        }
      });
    }

    resetForm() {
      this.firstname = '';
      this.middlename = null;
      this.lastname = '';
      this.email = '';
      this.address = null;
      this.bio = null;
      this.selectedRoleId = null;
      this.password = '';
      this.password_confirmation = '';
    }
  }