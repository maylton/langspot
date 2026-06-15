-- Ask PostgREST to refresh its schema after adding streak protection resources.
notify pgrst, 'reload schema';
