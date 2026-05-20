CREATE OR REPLACE FUNCTION public.list_all_triggers()
RETURNS TABLE(trigger_name text, table_name text, action_statement text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tgname::text, relname::text, pg_get_triggerdef(pg_trigger.oid)::text
  FROM pg_trigger
  JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
  WHERE relname = 'transactions';
END;
$$;
