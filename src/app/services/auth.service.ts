// src/services/auth.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  // Retrieve user based on stored token/user data
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Retrieve user from localStorage (Requires both user and token to be considered logged in)
  private getStoredUser(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token'); // Check for token
    return (storedUser && token) ? JSON.parse(storedUser) : null;
  }

  // Store user and token in localStorage and update observable
  private setUserData(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
    console.log('✅ User and token stored:', { email: user.email, token: token.substring(0, 20) + '...' });
  }

  // Clear user data and token
  private clearUserData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    console.log('🗑️ User data and token cleared');
  }

  // User Registration
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((response: any) => {
        console.log('📝 Registration response:', response);
        // Handle registration response if it returns token
        if (response.user && response.access_token) {
          this.setUserData(response.user, response.access_token);
        }
      })
    );
  }

  // FIXED: Login (Now looks for 'access_token' instead of 'token')
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('🔐 Login response:', response);
        
        // ✅ FIXED: Check for 'access_token' (what Laravel returns)
        if (response.user && response.access_token) {
          this.setUserData(response.user, response.access_token);
        } else {
          console.error('❌ Login response missing user or access_token:', response);
        }
      })
    );
  }

  // Get current logged-in user
  getUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`).pipe(
      tap((user: User) => {
        const token = localStorage.getItem('token');
        if (token) {
          this.setUserData(user, token);
        }
      })
    );
  }

  // Update user profile
  updateUserProfile(userData: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/profile`, userData).pipe(
      tap((response: any) => {
        console.log('✅ Profile updated:', response);
        // Laravel returns { success: true, user: {...} }
        if (response.user) {
          const token = localStorage.getItem('token');
          if (token) {
            this.setUserData(response.user, token);
          }
        }
      })
    );
  }

  // Logout user
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearUserData())
    );
  }

  // Helper: get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Helper: check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Helper: get user's role
  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user?.role?.name?.toLowerCase() || user?.roles?.[0]?.name?.toLowerCase() || null;
  }

  // Helper: check if user has a role
  hasRole(roleName: string): boolean {
    return this.getUserRole() === roleName.toLowerCase();
  }

  // Helper: get current user value (synchronous)
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}