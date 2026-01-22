-- Create match_stats table for live match statistics
CREATE TABLE public.match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  possession integer NOT NULL DEFAULT 50,
  shots_on_target integer NOT NULL DEFAULT 0,
  fouls integer NOT NULL DEFAULT 0,
  corners integer NOT NULL DEFAULT 0,
  yellow_cards integer NOT NULL DEFAULT 0,
  red_cards integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(match_id, team_id)
);

-- Enable RLS
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view match_stats" ON public.match_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert match_stats" ON public.match_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update match_stats" ON public.match_stats FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete match_stats" ON public.match_stats FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_match_stats_updated_at
  BEFORE UPDATE ON public.match_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_stats;