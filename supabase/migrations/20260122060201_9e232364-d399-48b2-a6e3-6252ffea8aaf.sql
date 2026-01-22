-- Add timer and half-time columns to matches
ALTER TABLE public.matches 
ADD COLUMN started_at timestamp with time zone,
ADD COLUMN half text DEFAULT 'first' CHECK (half IN ('first', 'second', 'finished'));

-- Create substitutions table
CREATE TABLE public.substitutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_out_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_in_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  minute integer NOT NULL,
  half text NOT NULL DEFAULT 'first',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on substitutions
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

-- RLS policies for substitutions
CREATE POLICY "Anyone can view substitutions" ON public.substitutions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert substitutions" ON public.substitutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update substitutions" ON public.substitutions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete substitutions" ON public.substitutions FOR DELETE USING (true);

-- Enable realtime for substitutions
ALTER PUBLICATION supabase_realtime ADD TABLE public.substitutions;