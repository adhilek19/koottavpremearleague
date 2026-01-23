-- Add yellow and red card columns to players table
ALTER TABLE public.players 
ADD COLUMN yellow_cards integer NOT NULL DEFAULT 0,
ADD COLUMN red_cards integer NOT NULL DEFAULT 0,
ADD COLUMN suspended_until_match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL;