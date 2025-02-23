import { Repository } from "@shared/schema";

export interface MessageTemplate {
  id: string;
  name: string;
  template: string;
  description: string;
  event: RepositoryEventType;
}

export type RepositoryEventType = 
  | 'repository_added'
  | 'push'
  | 'pull_request'
  | 'issue'
  | 'star'
  | 'fork';

// Default templates for different event types
export const defaultTemplates: MessageTemplate[] = [
  {
    id: 'repo-added',
    name: 'Repository Added',
    template: '{{user.username}} added a new repository: {{repository.name}}. Access it at {{repository.url}}',
    description: 'Sent when a new repository is added to tracking',
    event: 'repository_added'
  },
  {
    id: 'repo-push',
    name: 'Repository Push',
    template: 'New push to {{repository.fullName}} by {{sender}}',
    description: 'Sent when code is pushed to the repository',
    event: 'push'
  },
  {
    id: 'pull-request',
    name: 'Pull Request',
    template: 'New pull request in {{repository.fullName}}: {{action}} by {{sender}}',
    description: 'Sent when a pull request is created or updated',
    event: 'pull_request'
  }
];

interface TemplateVariables {
  repository: Repository;
  user?: {
    username: string;
    id: number;
  };
  sender?: string;
  action?: string;
}

export function formatTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = variables;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return match;
    }
    
    return String(value);
  });
}

// Get template by event type
export function getTemplateForEvent(event: RepositoryEventType): MessageTemplate {
  return defaultTemplates.find(t => t.event === event) || defaultTemplates[0];
}

// Format message using template
export function formatMessage(event: RepositoryEventType, variables: TemplateVariables): string {
  const template = getTemplateForEvent(event);
  return formatTemplate(template.template, variables);
}
