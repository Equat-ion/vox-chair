export type VotingData = {
  yes: number;
  no: number;
  abstain: number;
  passed: boolean;
  adjourned?: boolean;
  removed?: boolean;
}