"use client";

import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { useEffect } from 'react';
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
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We capture manually above for Next.js SPA navigation
        capture_pageleave: true, // Track when users leave pages (engagement)
        autocapture: true,       // Clicks, form submissions, etc.
      });

      // Identify by device_id if available (links PostHog person to our telemetry)
      try {
        const deviceId = localStorage.getItem('th_device_id');
        if (deviceId) {
          posthog.identify(deviceId);
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, []);

  return (
    <Provider client={posthog}>
      <PostHogPageView />
      {children}
    </Provider>
  );
}
