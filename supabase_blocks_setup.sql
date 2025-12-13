-- Blocks Table (Blockchain-like structure)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_height BIGINT NOT NULL UNIQUE,
  block_hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT, -- NULL for genesis block
  merkle_root TEXT NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  block_reward BIGINT NOT NULL DEFAULT 0, -- Total points awarded in this block
  difficulty INTEGER NOT NULL,
  miner_address TEXT, -- Wallet that solved the last transaction (first to mine)
  mined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  block_time_seconds INTEGER, -- Time since previous block
  solana_signature TEXT, -- Transaction signature on Solana (if committed)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(block_height DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(block_hash);
CREATE INDEX IF NOT EXISTS idx_blocks_previous ON blocks(previous_hash);
CREATE INDEX IF NOT EXISTS idx_blocks_mined ON blocks(mined_at DESC);

-- Update mining_events to reference blocks instead of merkle_commitments
ALTER TABLE mining_events DROP CONSTRAINT IF EXISTS mining_events_merkle_commitment_id_fkey;
ALTER TABLE mining_events ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES blocks(id);
CREATE INDEX IF NOT EXISTS idx_mining_events_block ON mining_events(block_id);
CREATE INDEX IF NOT EXISTS idx_mining_events_uncommitted ON mining_events(block_id) WHERE block_id IS NULL;

-- Keep merkle_commitments for backward compatibility, but link to blocks
ALTER TABLE merkle_commitments ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES blocks(id);
CREATE INDEX IF NOT EXISTS idx_merkle_commitments_block ON merkle_commitments(block_id);
