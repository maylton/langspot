-- The 4-argument review_assessment_response(uuid, numeric, text, jsonb) added in
-- 20260904050000 validates rubric scores against the published snapshot. Because it
-- has a different signature, `create or replace` added an overload instead of
-- replacing the original 3-argument version, which is still granted to
-- `authenticated`. PostgREST resolves overloads by argument names, so an RPC call
-- with only p_response_id/p_score/p_feedback reaches the legacy function and stores
-- a score on a rubric-scored response without any rubric validation.

drop function if exists public.review_assessment_response(uuid, numeric, text);
