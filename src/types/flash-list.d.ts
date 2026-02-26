declare module '@shopify/flash-list' {
  import { FlashList as OriginalFlashList, FlashListProps } from '@shopify/flash-list';
  
  export * from '@shopify/flash-list';
  
  // Extend the props to ensure estimatedItemSize is recognized
  export interface FlashListProps<T> {
    estimatedItemSize?: number;
  }
  
  export const FlashList: typeof OriginalFlashList;
}
