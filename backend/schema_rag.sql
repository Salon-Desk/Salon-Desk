-- SalonDesk semantic search index (pgvector). Aligns with KnowledgeChunk ORM.
CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
    CREATE TYPE knowledge_entity_type AS ENUM (
        'service', 'organization', 'category', 'policy', 'platform',
        'org_guide', 'admin_guide'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Existing DBs created before guide types: add values if missing.
DO $$ BEGIN
    ALTER TYPE knowledge_entity_type ADD VALUE IF NOT EXISTS 'org_guide';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE knowledge_entity_type ADD VALUE IF NOT EXISTS 'admin_guide';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_chunk (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    entity_type knowledge_entity_type NOT NULL,
    entity_id UUID,
    org_id UUID REFERENCES organization(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(8) NOT NULL,
    embedding VECTOR(384),
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_knowledge_chunk_entity_type ON knowledge_chunk (entity_type);
CREATE INDEX IF NOT EXISTS ix_knowledge_chunk_entity_id ON knowledge_chunk (entity_id);
CREATE INDEX IF NOT EXISTS ix_knowledge_chunk_org_id ON knowledge_chunk (org_id);
CREATE INDEX IF NOT EXISTS ix_knowledge_chunk_language ON knowledge_chunk (language);
CREATE INDEX IF NOT EXISTS ix_knowledge_chunk_active_lang
    ON knowledge_chunk (is_active, language);
