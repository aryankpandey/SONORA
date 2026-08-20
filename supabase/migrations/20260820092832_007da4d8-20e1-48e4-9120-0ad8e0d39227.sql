
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Listener',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1), 'Listener'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artists TO anon, authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artists_public_read" ON public.artists FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "artists_admin_write" ON public.artists FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  artwork_url TEXT,
  release_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX albums_artist_idx ON public.albums(artist_id);
GRANT SELECT ON public.albums TO anon, authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums_public_read" ON public.albums FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "albums_admin_write" ON public.albums FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  artwork_url TEXT,
  duration INT NOT NULL DEFAULT 0,
  genre TEXT,
  track_number INT,
  release_year INT,
  play_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX songs_artist_idx ON public.songs(artist_id);
CREATE INDEX songs_album_idx ON public.songs(album_id);
CREATE INDEX songs_title_idx ON public.songs(lower(title));
GRANT SELECT ON public.songs TO anon, authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "songs_public_read" ON public.songs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "songs_admin_write" ON public.songs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX playlists_user_idx ON public.playlists(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT ALL ON public.playlists TO service_role;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_own" ON public.playlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, song_id)
);
CREATE INDEX playlist_songs_playlist_idx ON public.playlist_songs(playlist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_songs TO authenticated;
GRANT ALL ON public.playlist_songs TO service_role;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlist_songs_own" ON public.playlist_songs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));

CREATE TABLE public.liked_songs (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, song_id)
);
GRANT SELECT, INSERT, DELETE ON public.liked_songs TO authenticated;
GRANT ALL ON public.liked_songs TO service_role;
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "liked_songs_own" ON public.liked_songs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recently_played (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recently_played_user_idx ON public.recently_played(user_id, played_at DESC);
GRANT SELECT, INSERT, DELETE ON public.recently_played TO authenticated;
GRANT ALL ON public.recently_played TO service_role;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recently_played_own" ON public.recently_played FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.saved_albums (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, album_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_albums TO authenticated;
GRANT ALL ON public.saved_albums TO service_role;
ALTER TABLE public.saved_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_albums_own" ON public.saved_albums FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.followed_artists (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);
GRANT SELECT, INSERT, DELETE ON public.followed_artists TO authenticated;
GRANT ALL ON public.followed_artists TO service_role;
ALTER TABLE public.followed_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followed_artists_own" ON public.followed_artists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Demo catalog (sample audio from SoundHelix, free for demo use)
INSERT INTO public.artists (slug, name, bio, image_url, cover_url)
SELECT s, n, b,
  'https://picsum.photos/seed/' || s || '-artist/600/600',
  'https://picsum.photos/seed/' || s || '-cover/1600/600'
FROM (VALUES
  ('nova-kestrel','Nova Kestrel','Synth-pop architect building cathedrals out of neon and reverb.'),
  ('halcyon-drift','Halcyon Drift','Ambient duo mapping the quiet space between two cities.'),
  ('mira-solace','Mira Solace','Soul vocalist with a whisper that fills stadiums.'),
  ('the-paper-tigers','The Paper Tigers','Four friends, loud guitars and a stubborn love of choruses.'),
  ('lo-fi-atlas','Lo-Fi Atlas','Dusty drum loops and tape-warped pianos for late study nights.'),
  ('velvet-circuit','Velvet Circuit','House producer splicing disco strings into modular grooves.'),
  ('orin-vale','Orin Vale','Folk storyteller from the north coast: one guitar, no filter.'),
  ('saffron-echo','Saffron Echo','Global-pop collective blending tabla, trap and choir.')
) AS t(s, n, b);

INSERT INTO public.albums (slug, title, artist_id, artwork_url, release_year)
SELECT t.s, t.title, a.id, 'https://picsum.photos/seed/' || t.s || '-art/600/600', t.yr
FROM (VALUES
  ('neon-cartography','Neon Cartography','nova-kestrel',2024),
  ('after-hours-signal','After Hours Signal','nova-kestrel',2022),
  ('slow-parallax','Slow Parallax','halcyon-drift',2023),
  ('weightless-rooms','Weightless Rooms','halcyon-drift',2021),
  ('golden-static','Golden Static','mira-solace',2025),
  ('paper-crown','Paper Crown','the-paper-tigers',2024),
  ('cassette-summer','Cassette Summer','lo-fi-atlas',2023),
  ('midnight-desk','Midnight Desk','lo-fi-atlas',2025),
  ('velour','Velour','velvet-circuit',2024),
  ('northlight','Northlight','orin-vale',2022),
  ('monsoon-choir','Monsoon Choir','saffron-echo',2025),
  ('first-light','First Light','mira-solace',2021)
) AS t(s, title, artist_slug, yr)
JOIN public.artists a ON a.slug = t.artist_slug;

WITH raw(album_slug, track_no, title) AS (VALUES
  ('neon-cartography',1,'Neon Cartography'),('neon-cartography',2,'Glass Avenues'),('neon-cartography',3,'Kestrel'),('neon-cartography',4,'Signal Bloom'),
  ('after-hours-signal',1,'After Hours'),('after-hours-signal',2,'Radio Static Love'),('after-hours-signal',3,'Chrome Rain'),
  ('slow-parallax',1,'Slow Parallax'),('slow-parallax',2,'Cirrus'),('slow-parallax',3,'Long Exposure'),('slow-parallax',4,'Blue Hour'),
  ('weightless-rooms',1,'Weightless'),('weightless-rooms',2,'Room Four'),('weightless-rooms',3,'Snowfall Protocol'),
  ('golden-static',1,'Golden Static'),('golden-static',2,'Tell Me Twice'),('golden-static',3,'Bruised Velvet'),('golden-static',4,'Sunday Bones'),
  ('paper-crown',1,'Paper Crown'),('paper-crown',2,'Loud Hearts'),('paper-crown',3,'Backseat Anthem'),('paper-crown',4,'Static Teeth'),
  ('cassette-summer',1,'Cassette Summer'),('cassette-summer',2,'Porch Light'),('cassette-summer',3,'Analog Nap'),
  ('midnight-desk',1,'Midnight Desk'),('midnight-desk',2,'Blue Ink'),('midnight-desk',3,'Small Hours'),('midnight-desk',4,'Coffee Ring'),
  ('velour',1,'Velour'),('velour',2,'Discotheque Ghost'),('velour',3,'Circuit Kiss'),
  ('northlight',1,'Northlight'),('northlight',2,'Harbour Song'),('northlight',3,'Winter Ferry'),
  ('monsoon-choir',1,'Monsoon Choir'),('monsoon-choir',2,'Saffron Sky'),('monsoon-choir',3,'Tabla Heartbeat'),('monsoon-choir',4,'Rainbreak'),
  ('first-light',1,'First Light'),('first-light',2,'Paper Lungs'),('first-light',3,'Quiet Riot Girl')
), numbered AS (
  SELECT raw.*, row_number() OVER (ORDER BY album_slug, track_no) AS n FROM raw
)
INSERT INTO public.songs (slug, title, artist_id, album_id, audio_url, artwork_url, duration, genre, track_number, release_year, play_count)
SELECT
  numbered.album_slug || '-' || numbered.track_no,
  numbered.title,
  al.artist_id,
  al.id,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-' || ((numbered.n % 16) + 1) || '.mp3',
  al.artwork_url,
  170 + ((numbered.n * 17) % 130),
  CASE ar.slug
    WHEN 'nova-kestrel' THEN 'Synth-pop'
    WHEN 'halcyon-drift' THEN 'Ambient'
    WHEN 'mira-solace' THEN 'Soul'
    WHEN 'the-paper-tigers' THEN 'Rock'
    WHEN 'lo-fi-atlas' THEN 'Lo-fi'
    WHEN 'velvet-circuit' THEN 'House'
    WHEN 'orin-vale' THEN 'Folk'
    ELSE 'World Pop'
  END,
  numbered.track_no,
  al.release_year,
  130000 - (numbered.n * 1900) + ((numbered.n % 7) * 8000)
FROM numbered
JOIN public.albums al ON al.slug = numbered.album_slug
JOIN public.artists ar ON ar.id = al.artist_id;
