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

  // Token-based login (no CSRF, no CORS)
  onSignIn() {
    const credentials = { email: this.email, password: this.password };

    this.authService.login(credentials).pipe(
      catchError((loginErr) => {
        const message =
          loginErr.error?.message ||
          Object.values(loginErr.error?.errors || {})
            .flat()
            .join('\n') ||
          'Unknown login error';
        alert('Login failed:\n' + message);
        return EMPTY;
      })
    ).subscribe({
      next: (response: any) => {
        // Save the access token for protected requests
        localStorage.setItem('access_token', response.access_token);

        console.log("LOGIN SUCCESS! ATTEMPTING REDIRECT.");

        // Redirect after successful login
        this.router.navigate(['/']);
      }
    });
  }
}
