import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

interface AddressData {
  country?: string;
  cityState?: string;
  postalCode?: string;
  taxId?: string;
}

@Component({
  selector: 'app-user-address-card',
  imports: [
    CommonModule,
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent,
    FormsModule,
  ],
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent implements OnInit {
  currentUser: any = null;
  addressData: AddressData = {};
  editAddress: AddressData = {};
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
        //this.parseAddress(user.address);
        this.addressData = {
          country: 'Test Country',
          cityState: 'Test City, Test State',
          postalCode: 'TEST123',
          taxId: 'TAX456'
        };
      }
    });
  }

  parseAddress(addressString: string | null): void {
    // Try to parse the address field as JSON
    // If it's JSON, use it; otherwise, treat it as plain text
    if (!addressString) {
      this.addressData = {};
      return;
    }

    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(addressString);
      this.addressData = {
        country: parsed.country || '',
        cityState: parsed.cityState || '',
        postalCode: parsed.postalCode || '',
        taxId: parsed.taxId || ''
      };
    } catch (e) {
      // If not JSON, treat as plain text address
      // You can split it or just show it in the country field
      this.addressData = {
        country: addressString,
        cityState: '',
        postalCode: '',
        taxId: ''
      };
    }
  }

  openModal(): void {
    // Create a copy of current address for editing
    this.editAddress = { ...this.addressData };
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
    this.editAddress = {};
  }

  handleSave(): void {
    if (this.editAddress) {
      // Convert the address object to JSON string for storage
      const addressJson = JSON.stringify(this.editAddress);
      
      // Update via AuthService
      this.authService.updateUserProfile({ address: addressJson }).subscribe({
        next: (response) => {
          console.log('Address updated successfully', response);
          this.currentUser = response.user;
          this.parseAddress(response.user.address);
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating address:', error);
          // Handle error (show toast notification, etc.)
        }
      });
    }
  }
}