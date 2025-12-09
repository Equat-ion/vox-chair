type CategoryType = 'standard' | 'info' | 'destructive' | 'addition'

export function getCategoryColor(category: CategoryType): string {
  switch (category) {
    case 'destructive':
      return 'text-red-500'
    case 'addition':
      return 'text-green-500'
    case 'info':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

export function getCategoryBadgeVariant(category: CategoryType): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (category) {
    case 'destructive':
      return 'destructive'
    case 'addition':
      return 'default'
    case 'info':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function getActionIcon(actionType: string): string {
  const iconMap = {
    'member-renamed': 'pencil',
    'draft-created': 'file-text',
    'draft-deleted': 'x',
    'session-start': 'play',
    'session-end': 'stop',
    'default': 'clock'
  } as const

  return iconMap[actionType as keyof typeof iconMap] || iconMap.default
}