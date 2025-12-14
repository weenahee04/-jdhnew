// Merkle Tree Implementation for Mining Events
import crypto from 'crypto';

export interface MiningEvent {
  id: string;
  walletAddress: string;
  challengeId: string;
  solutionHash: string;
  pointsAwarded: number;
  difficulty: number;
  timestamp: number;
}

export class MerkleTree {
  private leaves: string[];
  private tree: string[][];

  constructor(events: MiningEvent[]) {
    // Create leaf hashes from events
    this.leaves = events.map(event => this.hashEvent(event));
    this.tree = [this.leaves];

    // Build tree bottom-up
    this.buildTree();
  }

  private hashEvent(event: MiningEvent): string {
    const data = `${event.id}:${event.walletAddress}:${event.challengeId}:${event.solutionHash}:${event.pointsAwarded}:${event.difficulty}:${event.timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashPair(left: string, right: string): string {
    return crypto.createHash('sha256').update(left + right).digest('hex');
  }

  private buildTree(): void {
    let currentLevel = this.leaves;
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Pair exists
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          // Odd number of nodes, hash with itself
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i]));
        }
      }
      
      this.tree.push(nextLevel);
      currentLevel = nextLevel;
    }
  }

  getRoot(): string {
    return this.tree[this.tree.length - 1][0];
  }

  getProof(eventIndex: number): string[] {
    const proof: string[] = [];
    let index = eventIndex;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const levelNodes = this.tree[level];
      const isLeft = index % 2 === 0;
      const siblingIndex = isLeft ? index + 1 : index - 1;

      if (siblingIndex < levelNodes.length) {
        proof.push(levelNodes[siblingIndex]);
      } else {
        // No sibling, use self (for odd number of nodes)
        proof.push(levelNodes[index]);
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  verifyProof(event: MiningEvent, proof: string[], root: string): boolean {
    let hash = this.hashEvent(event);
    let index = 0;

    for (const sibling of proof) {
      const isLeft = index % 2 === 0;
      hash = isLeft ? this.hashPair(hash, sibling) : this.hashPair(sibling, hash);
      index = Math.floor(index / 2);
    }

    return hash === root;
  }

  getAllEvents(): MiningEvent[] {
    // This would need to be stored separately
    return [];
  }
}

// Helper function to create Merkle tree from events
export function createMerkleTree(events: MiningEvent[]): MerkleTree {
  return new MerkleTree(events);
}

// Helper function to verify a mining event receipt
export function verifyMiningReceipt(
  event: MiningEvent,
  proof: string[],
  root: string
): boolean {
  const tree = new MerkleTree([event]);
  return tree.verifyProof(event, proof, root);
}




