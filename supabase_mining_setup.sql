-- Mining System Database Schema

-- Mining Points Table
CREATE TABLE IF NOT EXISTS mining_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  date DATE NOT NULL,
  points BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, date)
);

CREATE INDEX IF NOT EXISTS idx_mining_points_wallet ON mining_points(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mining_points_date ON mining_points(date);
CREATE INDEX IF NOT EXISTS idx_mining_points_total ON mining_points(wallet_address, points DESC);

-- Mining Audit Logs
CREATE TABLE IF NOT EXISTS mining_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL, -- 'challenge_generated', 'solution_accepted', 'solution_failed', etc.
  challenge_id TEXT,
  difficulty INTEGER,
  points_awarded BIGINT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mining_audit_wallet ON mining_audit_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mining_audit_action ON mining_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_mining_audit_created ON mining_audit_logs(created_at DESC);

-- Mining Sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS mining_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_solutions INTEGER DEFAULT 0,
  total_points BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_mining_sessions_wallet ON mining_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mining_sessions_active ON mining_sessions(is_active, last_activity DESC);

-- Merkle Commitments (for on-chain anchoring)
CREATE TABLE IF NOT EXISTS merkle_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merkle_root TEXT NOT NULL,
  block_height BIGINT,
  transaction_signature TEXT,
  committed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_count INTEGER NOT NULL,
  events_hash TEXT NOT NULL -- Hash of all events in this commitment
);

CREATE INDEX IF NOT EXISTS idx_merkle_commitments_root ON merkle_commitments(merkle_root);
CREATE INDEX IF NOT EXISTS idx_merkle_commitments_committed ON merkle_commitments(committed_at DESC);

-- Mining Events (for Merkle tree)
CREATE TABLE IF NOT EXISTS mining_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  solution_hash TEXT NOT NULL,
  points_awarded BIGINT NOT NULL,
  difficulty INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  merkle_commitment_id UUID REFERENCES merkle_commitments(id),
  merkle_proof TEXT -- JSON array of proof hashes
);

CREATE INDEX IF NOT EXISTS idx_mining_events_wallet ON mining_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_mining_events_commitment ON mining_events(merkle_commitment_id);
CREATE INDEX IF NOT EXISTS idx_mining_events_uncommitted ON mining_events(merkle_commitment_id) WHERE merkle_commitment_id IS NULL;

