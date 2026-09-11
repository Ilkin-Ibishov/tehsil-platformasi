CREATE TABLE public.bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT,
    attempt_id UUID REFERENCES public.attempt_items(id),
    route TEXT,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert reports.
CREATE POLICY "Allow public insert to bug_reports"
    ON public.bug_reports
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow app_runtime to insert (if backend routing is used).
GRANT INSERT ON public.bug_reports TO app_runtime;
