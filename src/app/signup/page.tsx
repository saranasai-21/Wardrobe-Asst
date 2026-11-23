'use client';

import { Suspense } from 'react';
import LoginPage from '../login/page';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}>
      <LoginPage />
    </Suspense>
  );
}
