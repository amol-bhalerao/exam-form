import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="student-profile-container">
      <div class="profile-header">
        <h1>Student Profile</h1>
        <p>Profile management is coming soon</p>
      </div>
    </div>
  `,
  styles: [`
    .student-profile-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .profile-header h1 {
      font-size: 2rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .profile-header p {
      color: #999;
      font-size: 1rem;
    }
  `]
})
export class StudentProfileComponent {}
