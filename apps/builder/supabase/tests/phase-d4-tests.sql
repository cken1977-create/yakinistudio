-- YAKINI BUILDER · Design D4 imagery checks. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Signed-in users can't read or write the kit library or see image spend.
SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT count(*) FROM builder.kit_library_images$q$), 'signed-in users cannot read the kit library');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.kit_library_images (kit_id, slot, storage_path, width, height, alt, quality_score, license_provider, license_model, license_prompt, license_created_at) VALUES ('food-truck','scene-1','kit-library/food-truck/00000000-0000-0000-0000-000000000001.webp',10,10,'x',0.9,'x','x','x',now())$q$), 'signed-in users cannot add to the kit library');
  PERFORM bt.ok(bt.raises($q$SELECT builder.ai_image_usd_today()$q$), 'signed-in users cannot read image spend');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE v_t uuid := 'aaaaaaaa-0000-0000-0000-000000000001'; v_id uuid := gen_random_uuid(); v_before numeric;
BEGIN
  -- A generated image must carry its licence: provider, model, prompt and date.
  PERFORM bt.ok(bt.raises(format($q$INSERT INTO builder.assets (id, tenant_id, kind, storage_path, mime, source, license_kind) VALUES (%L, %L, 'image', %L, 'image/webp', 'generated', 'generated')$q$, v_id, v_t, v_t || '/' || v_id || '.webp')), 'a generated image without licence fields is refused');
  INSERT INTO builder.assets (id, tenant_id, kind, storage_path, mime, width, height, alt, source, license_kind, quality_score, quality_reasons, focus_x, focus_y, lqip, variants, dhash, license_provider, license_model, license_prompt, license_created_at)
  VALUES (v_id, v_t, 'image', v_t || '/' || v_id || '.webp', 'image/webp', 2400, 1350, 'A food truck window at dusk', 'generated', 'generated', 0.91, '{}', 0.4, 0.5, 'data:image/webp;base64,AAAA',
          jsonb_build_array(jsonb_build_object('format','avif','width',640,'height',360,'crop','full','path', v_t || '/' || v_id || '/full-640.avif')), '0123456789abcdef', 'xai', 'grok-imagine-image-2.0', 'a food truck window at dusk. No text.', now());
  PERFORM bt.ok((SELECT quality_score FROM builder.assets WHERE id = v_id) = 0.91, 'a generated image keeps its check score, focus, placeholder and variants');
  PERFORM bt.ok(bt.raises(format($q$UPDATE builder.assets SET lqip = 'https://evil.example/x.png' WHERE id = %L$q$, v_id)), 'a placeholder must be an inline WebP data URI');
  PERFORM bt.ok(bt.raises(format($q$UPDATE builder.assets SET focus_x = 1.5 WHERE id = %L$q$, v_id)), 'focus must be inside the picture');

  -- Image spend counts only image runs from today.
  v_before := builder.ai_image_usd_today();
  INSERT INTO builder.ai_runs (kind, model, prompt_version, outcome, usd) VALUES ('image', 'grok-imagine-image-2.0', 'd4', 'ok', 0.08), ('image_check', 'grok-4', 'd4', 'ok', 0.01), ('generate', 'grok-4', 'g', 'ok', 5);
  INSERT INTO builder.ai_runs (kind, model, prompt_version, outcome, usd, created_at) VALUES ('image', 'x', 'd4', 'ok', 3, now() - interval '2 days');
  PERFORM bt.ok(builder.ai_image_usd_today() - v_before = 0.09, 'image spend today counts image and check runs only, today only');
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.ai_runs (kind, model, prompt_version, outcome, usd) VALUES ('image', 'x', 'd4', 'ok', -1)$q$), 'spend can never be negative');

  -- The library keeps its own licence fields and lives under kit-library/.
  INSERT INTO builder.kit_library_images (kit_id, slot, storage_path, width, height, alt, quality_score, license_provider, license_model, license_prompt, license_created_at)
  VALUES ('food-truck', 'scene-1', 'kit-library/food-truck/00000000-0000-0000-0000-000000000001.webp', 2400, 1350, 'A truck window', 0.9, 'xai', 'grok-imagine-image-2.0', 'prompt', now());
  PERFORM bt.ok(bt.raises($q$INSERT INTO builder.kit_library_images (kit_id, slot, storage_path, width, height, alt, quality_score, license_provider, license_model, license_prompt, license_created_at) VALUES ('food-truck', 'scene-2', 'tenant/../x.webp', 1, 1, 'x', 0.9, 'x', 'x', 'x', now())$q$), 'library files only live under kit-library/<kit>/');
  RAISE NOTICE 'ALL D4 TESTS PASSED';
END $$;
RESET ROLE;
