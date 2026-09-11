"use client";

import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += '?' + search;
      posthog.capture('$pageview', { '$current_url': url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      // Expose to window for telemetry integration and debugging
      (window as unknown as { posthog: typeof posthog }).posthog = posthog;

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NODE_ENV === 'production' ? '/ingest' : (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'),
        ui_host: 'https://eu.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We capture manually above for Next.js SPA navigation
        capture_pageleave: true, // Track when users leave pages (engagement)
        autocapture: true,       // Clicks, form submissions, etc.
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },
      });

      // Identify by device_id and student profile traits (links PostHog person to our telemetry)
      try {
        const deviceId = localStorage.getItem('th_device_id');
        if (deviceId) {
          const personProperties: Record<string, string | boolean> = {};
          const grade = localStorage.getItem('th_grade');
          if (grade) personProperties.grade = grade;
          const role = localStorage.getItem('th_role');
          if (role) personProperties.role = role;
          const goal = localStorage.getItem('th_goal');
          if (goal) personProperties.goal = goal;
          const onboarded = localStorage.getItem('th_onboarded');
          if (onboarded) personProperties.onboarded = onboarded === 'true';

          posthog.identify(deviceId, personProperties);
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, []);

  return (
    <Provider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </Provider>
  );
}
