
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['happy-assets','creator-assets','cms-media','vrm-assets'] LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b||'_select_own', b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b||'_insert_own', b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b||'_update_own', b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b||'_delete_own', b);
  END LOOP;
END $$;
