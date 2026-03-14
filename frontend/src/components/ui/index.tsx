// Re-export from components.tsx so both import paths work:
//   import { X } from '@/components/ui'
//   import { X } from '@/components/ui/components'
export * from './components';

// Legacy-only exports kept here for backward compatibility
export { default as DataTable } from '../tables/DataTable';
