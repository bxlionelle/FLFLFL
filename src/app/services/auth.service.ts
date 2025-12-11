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
  // NEW: Accepts and stores the token
  private setUserData(user: User, token: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token); // <-- Store the Token
    this.currentUserSubject.next(user);
  }

  // Clear user data and token
  private clearUserData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // <-- Clear the Token
    this.currentUserSubject.next(null);
  }

  // 🆕 NEW METHOD: User Registration (Kept existing, but removed withCredentials if token flow is used)
  register(userData: any): Observable<any> {
    // Note: If you want registration to use the token flow, remove withCredentials: true
    return this.http.post(`${this.apiUrl}/api/register`, userData); // Assumed /api/register route
  }

  // REMOVED: getCsrf() is removed as it's for the old session flow.

  // UPDATED: Login (NOW DIRECTLY POSTS TO API AND RECEIVES TOKEN)
  login(credentials: { email: string; password: string }): Observable<any> {
    // Note: Removed withCredentials: true
    return this.http.post(`${this.apiUrl}/api/login`, credentials).pipe(
      tap((response: any) => {
        // Check for both user and the new token property from the Laravel response
        if (response.user && response.token) {
          this.setUserData(response.user, response.token); // Pass both to store
        }
      })
    );
  }

  // Get current logged-in user
  getUser(): Observable<User> {
    // The TokenInterceptor will attach the Bearer token
    return this.http.get<User>(`${this.apiUrl}/api/user`).pipe( 
      // If successful, reset user data/token in case the token was only in memory
      tap((user: User) => this.setUserData(user, localStorage.getItem('token') || '')) 
    );
  }

  // UPDATED: Logout user (now revokes token on backend)
  logout(): Observable<any> {
    // The TokenInterceptor will attach the valid token to this request
    return this.http.post(`${this.apiUrl}/api/logout`, {}).pipe(
      tap(() => this.clearUserData()) // Clear token and user data on success
    );
  }

  // Helper: get user's role (no change)
  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user?.role?.name?.toLowerCase() || user?.roles?.[0]?.name?.toLowerCase() || null;
  }

  // Helper: check if user has a role (no change)
  hasRole(roleName: string): boolean {
    return this.getUserRole() === roleName.toLowerCase();
  }
}