-- Defense-in-depth backstop for the security remediation
-- (docs/superpowers/specs/2026-07-14-security-remediation-design.md).
--
-- The app queries every table with the service-role key, which BYPASSES RLS, so
-- enabling RLS with no policies leaves app behaviour unchanged while making the
-- tables deny-all to the anon/authenticated PostgREST roles. If a query is ever
-- accidentally issued with the anon key, it returns nothing instead of leaking
-- data — rather than relying solely on the per-route checks in app/api.

ALTER TABLE IF EXISTS users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suggestions             ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS pong_games              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pong_game_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS beer_die_games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS beer_die_game_players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS beer_die_sinks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hearts_games            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hearts_game_players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cornhole_games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cornhole_game_players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spikeball_games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spikeball_game_players  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pool_games              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pool_game_players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS poker_games             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS poker_game_players      ENABLE ROW LEVEL SECURITY;
