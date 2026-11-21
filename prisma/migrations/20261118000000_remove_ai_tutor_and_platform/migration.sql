-- Drop AI Tutor / AI Platform tables and supporting types.

DROP TABLE IF EXISTS "ai_tool_invocations" CASCADE;
DROP TABLE IF EXISTS "ai_memory_facts" CASCADE;
DROP TABLE IF EXISTS "ai_evaluation_runs" CASCADE;
DROP TABLE IF EXISTS "ai_usage_daily" CASCADE;
DROP TABLE IF EXISTS "ai_agent_runs" CASCADE;
DROP TABLE IF EXISTS "course_indexing_outbox" CASCADE;
DROP TABLE IF EXISTS "knowledge_source_hashes" CASCADE;
DROP TABLE IF EXISTS "knowledge_chunks" CASCADE;
DROP TABLE IF EXISTS "lecture_transcripts" CASCADE;
DROP TABLE IF EXISTS "student_learning_profiles" CASCADE;
DROP TABLE IF EXISTS "tutor_turn_idempotency" CASCADE;
DROP TABLE IF EXISTS "tutor_messages" CASCADE;
DROP TABLE IF EXISTS "tutor_threads" CASCADE;
DROP TABLE IF EXISTS "tutor_conversations" CASCADE;

DROP TYPE IF EXISTS "ai_tool_invocation_status";
DROP TYPE IF EXISTS "ai_agent_run_status";
DROP TYPE IF EXISTS "course_indexing_outbox_status";
DROP TYPE IF EXISTS "knowledge_sensitivity";
DROP TYPE IF EXISTS "knowledge_content_type";
DROP TYPE IF EXISTS "tutor_turn_idempotency_status";
DROP TYPE IF EXISTS "tutor_message_status";
DROP TYPE IF EXISTS "tutor_message_role";

ALTER TABLE "courses" DROP COLUMN IF EXISTS "knowledge_indexed_at";

DROP EXTENSION IF EXISTS vector;
