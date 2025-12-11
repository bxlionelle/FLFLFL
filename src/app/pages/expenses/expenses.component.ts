import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

interface Expense {
  category: string;
  description: string;
  status: string;
  date: string;
  amount: string;
  receipt: string;
}

interface User {
  name: string;
  role: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,  // Uncomment when you have the correct path
  ],
  templateUrl: './expenses.component.html',
  styles: ``
})
export class ExpensesComponent {
  // Current User Information
  currentUser: User = {
    name: 'Sarah Williams',
    role: 'Team Member'
  };

  // New Expense Form
  newExpense = {
    date: '',
    category: '',
    amount: 0,
    description: '',
    receipt: null as File | null
  };

  selectedFileName: string = '';

  // Expense History
  expenseHistory: Expense[] = [
    {
      category: 'Infrastructure',
      description: 'Cloud hosting services',
      status: 'Pending',
      date: '3/20/2024',
      amount: '150.00',
      receipt: 'receipt-002.pdf'
    }
  ];

  constructor() {
    console.log('Expenses component loaded');
  }

  // Handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.newExpense.receipt = file;
      console.log('File selected:', file.name);
    }
  }

  // Submit expense
  submitExpense() {
    // Validate form
    if (!this.newExpense.date) {
      alert('Please select a date');
      return;
    }

    if (!this.newExpense.category) {
      alert('Please enter a category');
      return;
    }

    if (!this.newExpense.amount || this.newExpense.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!this.newExpense.description) {
      alert('Please enter a description');
      return;
    }

    console.log('Submitting expense:', this.newExpense);

    // Add to expense history
    this.expenseHistory.unshift({
      category: this.newExpense.category,
      description: this.newExpense.description,
      status: 'Pending',
      date: this.formatDate(this.newExpense.date),
      amount: this.newExpense.amount.toFixed(2),
      receipt: this.selectedFileName || 'No receipt'
    });

    // Show success message
    alert('Expense submitted successfully!');

    // Reset form
    this.newExpense = {
      date: '',
      category: '',
      amount: 0,
      description: '',
      receipt: null
    };
    this.selectedFileName = '';
  }

  // Format date to match display format
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // View expense details
  viewExpenseDetails(expense: Expense) {
    console.log('Viewing expense:', expense);
    alert(`Category: ${expense.category}\nAmount: $${expense.amount}\nStatus: ${expense.status}\nDate: ${expense.date}`);
  }

  // Download receipt
  downloadReceipt(expense: Expense) {
    console.log('Downloading receipt:', expense.receipt);
    alert(`Downloading ${expense.receipt}...`);
    // Add your download logic here
  }
}