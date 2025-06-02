'use client';

import { CenteredSpinner } from './spinner';

export function HomeSpinner({ isLoading }: { isLoading?: boolean }) {
  if (!isLoading) {
    return <></>;
  }
  return <CenteredSpinner />;
}
