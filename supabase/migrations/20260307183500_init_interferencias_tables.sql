CREATE TABLE interferencias_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    current_turn INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE interferencias_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES interferencias_games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE interferencias_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES interferencias_games(id) ON DELETE CASCADE,
    chain_index INTEGER NOT NULL,
    turn INTEGER NOT NULL,
    player_id UUID REFERENCES interferencias_players(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime needs replication setup for these tables
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
