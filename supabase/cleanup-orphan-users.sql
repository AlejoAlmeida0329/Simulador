-- =====================================================
-- CLEANUP: Eliminar usuarios huérfanos
-- Usuarios que existen en auth.users pero no en user_profiles
-- =====================================================

-- Ver usuarios huérfanos (solo para verificar)
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- DESCOMENTAR PARA EJECUTAR LA LIMPIEZA:
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN public.user_profiles up ON au.id = up.id
--   WHERE up.id IS NULL
-- );
