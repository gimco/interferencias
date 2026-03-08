BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'interferencias_games') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE interferencias_games;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'interferencias_players') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE interferencias_players;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'interferencias_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE interferencias_items;
    END IF;
END
$$;
COMMIT;

