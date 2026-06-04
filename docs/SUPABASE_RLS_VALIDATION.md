# Supabase/RLS validation gate

Objetivo: validar el aislamiento real de Supabase antes de release publico masivo. Este gate es externo al repo porque requiere acceso al proyecto Supabase y no debe ejecutarse con secretos pegados en chat.

## Estado esperado para piloto

- `public.profiles` tiene RLS habilitado y policies activas.
- Las tablas tenant-scoped restantes se aislan por codigo con `organizationId` y `getTenantProfile()`.
- El `service_role` solo se usa server-side.
- Buckets de storage no aceptan SVG ni MIME falso en rutas endurecidas.

## Checklist antes de release publico masivo

1. Entrar al dashboard de Supabase del proyecto real.
2. Abrir SQL Editor y ejecutar consultas de inspeccion, sin modificar datos.
3. Confirmar que no hay secrets visibles en logs ni en respuestas.
4. Registrar resultado en `docs/RELEASE_CANDIDATE.md`.
5. Si algo falla, no declarar release publico hasta corregir policy/codigo.

## Consultas de inspeccion

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select
  table_schema,
  table_name,
  column_name
from information_schema.columns
where table_schema = 'public'
  and column_name = 'organizationId'
order by table_name;
```

## Pruebas manuales obligatorias

- Login como admin de una organizacion A.
- Intentar consultar/abrir datos de organizacion B desde UI y APIs conocidas.
- Confirmar que pedidos, productos, clientes, proveedores, compras, descuentos y POS no cruzan tenant.
- Login como staff sin permisos avanzados y confirmar denegacion server-side.
- Confirmar que impersonation solo funciona con usuario `SUPERADMIN`.

## Storage y uploads

- Verificar buckets usados por productos y QR Bolivia.
- Confirmar que el bucket no permite acceso publico de escritura.
- Subir PNG/JPEG/WEBP valido desde la app.
- Intentar SVG o MIME falso y confirmar rechazo.

## Variables y service role

- `SUPABASE_SERVICE_ROLE_KEY` debe existir solo en Vercel server-side/local privado.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` con prefijo `NEXT_PUBLIC_`.
- Rotar cualquier key que haya sido pegada en chat, logs o documentos versionables.

## Resultado esperado

Para release publico masivo, anexar en `docs/RELEASE_CANDIDATE.md`:

- fecha de validacion;
- quien valido;
- tablas con RLS habilitado;
- policies revisadas;
- pruebas multi-tenant realizadas;
- hallazgos y acciones correctivas.
