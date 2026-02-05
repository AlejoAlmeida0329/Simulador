-- =====================================================
-- FIX: Políticas RLS para permitir eliminaciones de Admin
-- =====================================================

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('comercial_invitations', 'user_profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- COMERCIAL_INVITATIONS: Permitir DELETE a admins
-- =====================================================

-- Eliminar política antigua si existe
DROP POLICY IF EXISTS "Admins can delete invitations" ON comercial_invitations;

-- Crear política nueva
CREATE POLICY "Admins can delete invitations"
ON comercial_invitations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
    AND user_profiles.approval_status = 'approved'
  )
);

-- =====================================================
-- USER_PROFILES: Permitir DELETE a admins
-- =====================================================

-- Eliminar política antigua si existe
DROP POLICY IF EXISTS "Admins can delete comerciales" ON user_profiles;

-- Crear política nueva
CREATE POLICY "Admins can delete comerciales"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  -- Solo permitir eliminar comerciales (no otros admins)
  role = 'comercial'
  AND
  -- El que elimina debe ser admin aprobado
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'admin'
    AND up.approval_status = 'approved'
  )
);

-- =====================================================
-- Verificar políticas creadas
-- =====================================================
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('comercial_invitations', 'user_profiles')
  AND cmd = 'DELETE'
ORDER BY tablename;
