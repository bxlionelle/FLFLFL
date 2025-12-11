import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { AuthService } from '../../../services/auth.service';
import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  roles?: string[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
  ],
  templateUrl: './app-sidebar.component.html',
})

export class AppSidebarComponent {
  currentUserRole: string | null = null;
  private readonly originalNavItems: NavItem[] =[
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
      name: "Dashboard",
      path: "/",
      roles: ['administrator', 'project_manager', 'member', 'client']
    },
    { 
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M6 20v-1c0-2.21 3.58-4 6-4s6 1.79 6 4v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M2 20h20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>`,
      name: "User Management",
      roles: ['administrator'],
      subItems: [
        { name: "Permissions", path: "/permissions" },
        { name: "Roles", path: "/roles" },
        { name: "Users", path: "/users" },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/> <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <line x1="7" y1="13" x2="17" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <circle cx="5" cy="9" r="1" fill="currentColor"/> <circle cx="5" cy="13" r="1" fill="currentColor"/> <circle cx="5" cy="17" r="1" fill="currentColor"/> </svg>`,
      name: "Project Management",
      path: "/project-management",
      roles: ['administrator', 'project_manager']
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="6.5" cy="9" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/> <path d="M4 17c0-1.5 3-2 4.5-2s4.5.5 4.5 2v1H4v-1z" stroke="currentColor" stroke-width="1.5" fill="none"/> <circle cx="12" cy="7" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/> <path d="M9 18c0-2 6-2 6 0v1H9v-1z" stroke="currentColor" stroke-width="1.5" fill="none"/> <circle cx="17.5" cy="9" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/> <path d="M15 17c0-1.5 3-2 4.5-2S24 15.5 24 17v1h-9v-1z" stroke="currentColor" stroke-width="1.5" fill="none"/> </svg>`,
      name: "Team Management",
      path: "/team-management", //they cant find this
      roles: ['administrator', 'project_manager']
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/> <path d="M3 9h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <path d="M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <path d="M10 10h4a1 1 0 010 2h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> <path d="M10 14h4a1 1 0 000-2h-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      name: "Task",
      path: "/task",
      roles: ['administrator', 'project_manager', 'member']
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"> <g fill="currentColor" stroke="none"> <path d="M17,12.05V11h3a5,5,0,0,0,5-5V4a1,1,0,0,0-1-1H20a4.92,4.92,0,0,0-3,1V1a1,1,0,0,0-2,0V2a4.92,4.92,0,0,0-3-1H8A1,1,0,0,0,7,2V4a5,5,0,0,0,5,5h3v3.05a10,10,0,1,0,2,0Zm3-7h3V6a3,3,0,0,1-3,3H17V8A3,3,0,0,1,20,5ZM9,4V3h3a3,3,0,0,1,3,3V7H12A3,3,0,0,1,9,4Zm7,26a8,8,0,1,1,8-8A8,8,0,0,1,16,30Z"></path> <path d="M16,19h2a1,1,0,0,0,0-2H17a1,1,0,0,0-2,0v.18A3,3,0,0,0,16,23a1,1,0,0,1,0,2H14a1,1,0,0,0,0,2h1a1,1,0,0,0,2,0v-.18A3,3,0,0,0,16,21a1,1,0,0,1,0-2Z"></path> <path d="M5.71,7.29l-2-2a1,1,0,0,0-1.42,0l-2,2A1,1,0,0,0,1.71,8.71L2,8.41V11a1,1,0,0,0,2,0V8.41l.29.3a1,1,0,0,0,1.42,0A1,1,0,0,0,5.71,7.29Z"></path> <path d="M31.71,13.29l-2-2a1,1,0,0,0-1.42,0l-2,2a1,1,0,0,0,1.42,1.42l.29-.3V17a1,1,0,0,0,2,0V14.41l.29.3a1,1,0,0,0,1.42,0A1,1,0,0,0,31.71,13.29Z"></path> </g> </svg>`,
      name: "Expenses",
      path: "/expenses",
      roles: ['administrator', 'project_manager', 'member']
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" id="icon"> <g fill="currentColor" stroke="none"> <rect x="16" y="28" width="7" height="2"></rect> <rect x="16" y="24" width="14" height="2"></rect> <rect x="16" y="20" width="14" height="2"></rect> <polygon points="4 20 4 22 8.586 22 2 28.586 3.414 30 10 23.414 10 28 12 28 12 20 4 20"></polygon> <path d="M28,8H16L12.5859,4.5859A2.0007,2.0007,0,0,0,11.1716,4H4A2,2,0,0,0,2,6V18H4V6h7.1716l3.4141,3.4141L15.1716,10H28v8h2V10A2,2,0,0,0,28,8Z"></path> </g> </svg>`,
      name: "Project Details",
      path: "/project-details",
      roles: ['administrator', 'project_manager', 'member', 'client']
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M16 1C17.6569 1 19 2.34315 19 4C19 4.55228 18.5523 5 18 5C17.4477 5 17 4.55228 17 4C17 3.44772 16.5523 3 16 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H16C16.5523 21 17 20.5523 17 20V19C17 18.4477 17.4477 18 18 18C18.5523 18 19 18.4477 19 19V20C19 21.6569 17.6569 23 16 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H16Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.7991 8.20087C20.4993 7.90104 20.0132 7.90104 19.7133 8.20087L11.9166 15.9977C11.7692 16.145 11.6715 16.3348 11.6373 16.5404L11.4728 17.5272L12.4596 17.3627C12.6652 17.3285 12.855 17.2308 13.0023 17.0835L20.7991 9.28666C21.099 8.98682 21.099 8.5007 20.7991 8.20087ZM18.2991 6.78666C19.38 5.70578 21.1325 5.70577 22.2134 6.78665C23.2942 7.86754 23.2942 9.61999 22.2134 10.7009L14.4166 18.4977C13.9744 18.9398 13.4052 19.2327 12.7884 19.3355L11.8016 19.5C10.448 19.7256 9.2744 18.5521 9.50001 17.1984L9.66448 16.2116C9.76728 15.5948 10.0602 15.0256 10.5023 14.5834L18.2991 6.78666Z" fill="currentColor"/> <path d="M5 7C5 6.44772 5.44772 6 6 6H14C14.5523 6 15 6.44772 15 7C15 7.55228 14.5523 8 14 8H6C5.44772 8 5 7.55228 5 7Z" fill="currentColor"/> <path d="M5 11C5 10.4477 5.44772 10 6 10H10C10.5523 10 11 10.4477 11 11C11 11.5523 10.5523 12 10 12H6C5.44772 12 5 11.5523 5 11Z" fill="currentColor"/> <path d="M5 15C5 14.4477 5.44772 14 6 14H7C7.55228 14 8 14.4477 8 15C8 15.5523 7.55228 16 7 16H6C5.44772 16 5 15.5523 5 15Z" fill="currentColor"/></svg>`,
      name: "Feedback",
      path: "/feedback",
      roles: ['administrator', 'client']
    },
  ];

  navItems: NavItem[] = [];
  othersItems: NavItem[] = [];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
      const user = JSON.parse(storedUser);
    }
    this.subscription.add(
    this.authService.currentUser$.subscribe(user => {
        this.currentUserRole = this.authService.getUserRole();
        this.filterNavItems();
        })
      );
    
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );
    
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            this.cdr.detectChanges();
          }
        }
      )
    );
    this.setActiveMenuFromRoute(this.router.url);
  }

    private filterNavItems() {
    if (this.currentUserRole) {
      this.navItems = this.originalNavItems.filter( item => !item.roles || item.roles.includes(this.currentUserRole!));
      this.cdr.detectChanges();
    } else {
      this.navItems = [];
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); 
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }  
}


