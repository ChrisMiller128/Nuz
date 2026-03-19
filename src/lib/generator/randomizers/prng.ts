import crypto from 'crypto';

/**
 * Seeded PRNG using a hash-chain approach for deterministic,
 * reproducible randomization across runs with the same seed.
 */
export class SeededRNG {
  private state: Buffer;
  private index: number;

  constructor(seed: string) {
    this.state = crypto.createHash('sha256').update(seed).digest();
    this.index = 0;
  }

  private advance(): void {
    this.index++;
    if (this.index >= this.state.length) {
      this.state = crypto
        .createHash('sha256')
        .update(this.state)
        .update(Buffer.from([this.index & 0xff, (this.index >> 8) & 0xff]))
        .digest();
      this.index = 0;
    }
  }

  nextByte(): number {
    const val = this.state[this.index];
    this.advance();
    return val;
  }

  nextU16(): number {
    return this.nextByte() | (this.nextByte() << 8);
  }

  /** Returns integer in [0, max) */
  nextInt(max: number): number {
    if (max <= 1) return 0;
    if (max <= 256) return this.nextByte() % max;
    return this.nextU16() % max;
  }

  /** Pick random element from array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(arr.length)];
  }

  /** Shuffle array in-place (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
