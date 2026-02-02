-- Add formation column to teams table
ALTER TABLE public.teams 
ADD COLUMN formation text DEFAULT '1-2-1';