-- Server-side counter for free "Ask Celeste" questions.
-- Per account and tamper-proof: users can READ their own count (to show how many
-- free questions remain) but cannot modify it. Only the service role — used by the
-- advisor edge function — increments it, so the limit can't be reset from the client.

CREATE TABLE IF NOT EXISTS public.advisor_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_questions_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.advisor_usage ENABLE ROW LEVEL SECURITY;

-- Read-only for the owner. Note there are deliberately NO insert/update/delete
-- policies, so RLS blocks all client writes; the service role bypasses RLS.
CREATE POLICY "Users can view own advisor usage" ON public.advisor_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER handle_updated_at_advisor_usage BEFORE UPDATE ON public.advisor_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create a usage row for every new user alongside their profile & subscription.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.advisor_usage (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Backfill existing users so reads return 0 instead of null.
INSERT INTO public.advisor_usage (user_id)
  SELECT id FROM auth.users
  ON CONFLICT (user_id) DO NOTHING;
