export type IndexCardRow =
  | {
      type: 'text'
      text: string
      size?: 'auto' | 'normal' | 'small'
    }
  | {
      type: 'divider'
    }
