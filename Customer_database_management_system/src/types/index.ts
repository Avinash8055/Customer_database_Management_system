export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | 'date';
  required: boolean;
  options?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SavedChecklist {
  title: string;
  items: string[];
}

export interface Customer {
  id: string;
  joinId: string;
  createdAt: string;
  entryDate: string; // Date when the data was entered
  dateAdded: string; // Date when the customer was added
  status: 'new' | 'in-progress' | 'completed';
  paid: boolean;
  checklist?: ChecklistItem[];
  checklistTitle?: string;
  [key: string]: any; // Dynamic fields
}

export interface PrintTemplate {
  id: string;
  name: string;
  header: string;
  footer: string;
}

export interface CustomerListProps {
  status?: 'new' | 'in-progress' | 'completed';
  includeNew?: boolean;
  title?: string;
}