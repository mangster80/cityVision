export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  city?: string;
  neighborhood?: string;
  role?: string;
  provider?: string;
  providerEmail?: string;
  authEmail?: string;
}
export interface Place { id: string; name: string; city: string; municipality: string; description: string; image: string; lat: number; lng: number; category: string; proposalCount: number; }
export interface Proposal { id: string; placeId: string; municipality: string; title: string; description: string; imageBefore: string; imageAfter: string; imagesBefore?: string[]; imagesAfter?: string[]; cost: number; votes: number; supporters: number; comments: number; author: User; collaborators: User[]; category: string; createdAt: string; }
export interface Vote { id: string; proposalId: string; userId: string; value: 1 | -1; }
export interface Support { id: string; proposalId: string; userId: string; createdAt: string; }
export interface Comment { id: string; proposalId: string; user: User; body: string; createdAt: string; }
