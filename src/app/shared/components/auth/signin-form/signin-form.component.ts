import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  email = '';
  password = '';
  isChecked = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // ✅ Updated SPA-ready login logic using switchMap
onSignIn() {
    const credentials = { email: this.email, password: this.password };
    
    // 1. Directly call login (no more CSRF fetching or switchMap needed)
    this.authService.login(credentials).pipe(
      
      // 2. Handle errors from the Login request (401 Unauthorized, 422 Validation, etc.)
      catchError((loginErr) => {
        // Your robust error message extraction logic:
        const message =
          loginErr.error?.message ||
          Object.values(loginErr.error?.errors || {})
            .flat()
            .join('\n') ||
          'Unknown login error';
        
        alert('Login failed:\n' + message);
        return EMPTY; // Stop the stream gracefully on login error
      })
      
    ).subscribe({
      // 3. Final Step: Success handling
      next: () => {
        console.log("LOGIN SUCCESS! ATTEMPTING REDIRECT.");
        this.router.navigate(['/']); // Redirect after successful login
      }
    });
  }
}