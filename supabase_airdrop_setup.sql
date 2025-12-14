-- Create airdrop_claims table
CREATE TABLE IF NOT EXISTS airdrop_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  transaction_signature TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_code ON airdrop_claims(code);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_wallet ON airdrop_claims(wallet_address);

-- Add comment
COMMENT ON TABLE airdrop_claims IS 'Records of airdrop code claims';




