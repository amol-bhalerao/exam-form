/**
 * Enhanced form utilities and styles for beautiful, responsive exam forms
 */

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  validators?: any[];
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  options?: Array<{ label: string; value: any }>;
  hint?: string;
  errorMessage?: string;
  col?: 1 | 2 | 3; // responsive column span
}

export interface FormSectionConfig {
  title: string;
  description?: string;
  icon?: string;
  fields: FormFieldConfig[];
  collapsible?: boolean;
  expanded?: boolean;
}

/**
 * Form styling CSS class definitions
 */
export const FORM_STYLES = `
  .form-container {
    display: grid;
    gap: 24px;
    padding: 20px;
    max-width: 1200px;
  }

  .form-section {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition);
  }

  .form-section:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
  }

  .form-section.collapsed {
    padding: 0;
  }

  .form-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border-radius: var(--radius-md);
    transition: all var(--transition);
    margin-bottom: 16px;
  }

  .form-section-header:hover {
    background: var(--surface-alt);
  }

  .form-section-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .form-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }

  .form-section-description {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 4px 0 0;
  }

  .form-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .form-grid.compact {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .form-grid.full {
    grid-template-columns: 1fr;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-field label {
    font-weight: 500;
    color: var(--text);
    font-size: 0.95rem;
  }

  .form-field label.required::after {
    content: ' *';
    color: var(--danger);
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 0.95rem;
    transition: all var(--transition);
    background: var(--panel);
    color: var(--text);
  }

  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  .form-field input::placeholder,
  .form-field textarea::placeholder {
    color: var(--text-secondary);
  }

  .form-field input:disabled,
  .form-field select:disabled,
  .form-field textarea:disabled {
    background: var(--surface-alt);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-field textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-hint {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .form-error {
    font-size: 0.8rem;
    color: var(--danger);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .form-field.error input,
  .form-field.error select,
  .form-field.error textarea {
    border-color: var(--danger);
    background: rgba(220, 38, 38, 0.05);
  }

  .form-field.success input,
  .form-field.success select,
  .form-field.success textarea {
    border-color: var(--success);
    background: rgba(5, 150, 105, 0.05);
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .form-actions button {
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all var(--transition);
  }

  .form-actions button.primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
  }

  .form-actions button.primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .form-actions button.secondary {
    background: var(--surface-alt);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .form-actions button.secondary:hover {
    background: var(--border);
  }

  .form-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-progress {
    height: 4px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .form-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    transition: width 0.3s ease;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-container {
      padding: 12px;
      gap: 16px;
    }

    .form-section {
      padding: 16px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }
`;

/**
 * Form validation error messages
 */
export const FORM_ERRORS = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (min: number) => `Minimum length is ${min} characters`,
  maxLength: (max: number) => `Maximum length is ${max} characters`,
  pattern: 'Please enter valid data',
  number: 'Please enter a valid number',
  date: 'Please enter a valid date',
  min: (min: number) => `Minimum value is ${min}`,
  max: (max: number) => `Maximum value is ${max}`,
  passwordMismatch: 'Passwords do not match'
};

/**
 * Common regex patterns for validation
 */
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10}$/,
  aadhar: /^[0-9]{12}$/,
  udise: /^[A-Z]{2}[0-9]{8}$/,
  collegeNo: /^[0-9]{6}$/,
  pincode: /^[0-9]{6}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  name: /^[a-zA-Z\s'-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/
};
