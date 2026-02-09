# Audio Narration (TTS) — Implementation Guide

## Overview

Story nodes can now have AI-generated audio narrations via ElevenLabs TTS. The backend generates MP3 audio on demand, stores it on S3/CDN, and returns a permanent URL. Audio generation is **usage-capped** per subscription tier, with a special lifetime-cap rule for free users.

---

## Backend Summary (Already Implemented)

The following is already live on the API. No further backend work is needed.

- **Model**: ElevenLabs Flash 2.5 (`eleven_flash_v2_5`) — generates in ~1-3 seconds.
- **Storage**: MP3 files stored in S3 at `audio/{world_id}/{node_id}.mp3`, served via the existing CloudFront CDN. URLs are permanent and publicly accessible (no signed URLs needed).
- **Idempotency**: If audio already exists for a node, the endpoint returns the cached URL instantly without consuming quota.
- **Race protection**: Concurrent requests for the same node are safe — only the first generation consumes quota.

### Tier Limits

| Tier      | Audio narrations per period | Period  | Reset behaviour                 |
| --------- | --------------------------- | ------- | ------------------------------- |
| FREE      | 20                          | 7 days  | **Never resets** (lifetime cap) |
| EXPLORER  | 60                          | 30 days | Resets each billing period      |
| COSMONAUT | 200                         | 30 days | Resets each billing period      |

> Free-tier audio is a one-time allowance — once the 20 narrations are used, the user must upgrade to generate more. Paid tiers get fresh quota each billing cycle.

---

## API Reference

### Generate Audio for a Node

```
POST /worlds/{world_id}/nodes/{node_id}/audio
```

**Auth**: Requires a valid JWT (same as all `/worlds` endpoints).

**Preconditions**:

- The node must exist.
- The node's `generation_status` must be `"completed"` (i.e., text has been fully generated). If text is still streaming or hasn't been generated, the endpoint returns `400`.

**Request body**: None.

**Success response** (`200 OK`):

```json
{
	"audio_url": "https://images.dev.cosmonaut-ai.com/audio/{world_id}/{node_id}.mp3"
}
```

The `audio_url` is a permanent CDN link to the MP3 file. It can be used directly in an HTML `<audio>` element.

**Error responses**:

| Status | Condition                          | Response `detail`                                  |
| ------ | ---------------------------------- | -------------------------------------------------- |
| `400`  | Node text not yet generated        | `"Node {node_id} text has not been generated yet"` |
| `403`  | User not authorized for this world | `"You are not authorized to access world ..."`     |
| `404`  | World or node not found            | `"World {id} not found"` / `"Node {id} not found"` |
| `429`  | Audio quota exceeded               | `"Quota exceeded: audio limit is {limit}"`         |
| `500`  | ElevenLabs or S3 failure           | `"Audio generation failed"`                        |

> The `429` response is the key one for triggering the upgrade prompt on the frontend.

---

### Get Usage Info (Updated)

```
GET /auth/usage
```

The existing usage endpoint now includes two new fields:

```json
{
	"tier": "EXPLORER",
	"nodes_used": 42,
	"nodes_limit": 500,
	"worlds_created": 3,
	"worlds_limit": 20,
	"worlds_stored": 3,
	"worlds_stored_limit": 50,
	"audio_narrations_used": 12,
	"audio_narrations_limit": 60,
	"period_end": "2026-03-08T00:00:00+00:00",
	"pending_cancellation": false,
	"cancellation_date": null,
	"subscription_status": "active",
	"pending_tier": null,
	"pending_tier_date": null
}
```

New fields:

- `audio_narrations_used` — how many audio narrations the user has generated this period (or lifetime for free tier).
- `audio_narrations_limit` — the user's tier cap.

---

### Story Node DTO (Updated)

All endpoints that return a `StoryNodeDTO` (`GET /worlds/{id}/nodes/`, `GET /worlds/{id}/nodes/{id}`, etc.) now include two new optional fields:

```json
{
	"id": "0a",
	"world_id": "abc123",
	"text": "The ancient door creaked open...",
	"title": "The Threshold",
	"generation_status": "completed",
	"audio_url": "https://images.dev.cosmonaut-ai.com/audio/abc123/0a.mp3",
	"audio_voice_id": "pNInz6obpgDQGcFmaJgB",
	"...": "..."
}
```

- `audio_url` — `string | null`. CDN URL of the generated MP3. `null` if audio has not been generated for this node.
- `audio_voice_id` — `string | null`. The ElevenLabs voice ID used. Included for future features (e.g., per-world voice selection). Can be ignored by the frontend for now.

---

## Frontend Implementation (Completed)

All frontend changes have been implemented. Here's what was done:

### 1. Types

- `StoryNode` (`src/lib/types/api.ts`): Added `audio_url: string | null` and `audio_voice_id: string | null`
- `UsageInfo` (`src/lib/types/subscription.ts`): Added `audio_narrations_used: number` and `audio_narrations_limit: number`

### 2. API Client

- `generateNodeAudio()` added to `src/lib/api/client.ts` — uses the existing `apiRequest` pattern with auth retry

### 3. TanStack Query

- `useGenerateAudio()` mutation added to `src/lib/queries/nodes.ts` — patches the node cache with `audio_url` on success, invalidates usage query

### 4. AudioNarration Component

New component at `src/lib/components/story/AudioNarration.svelte`:

- Self-contained: handles generation triggering + playback
- Three states: "Listen to narration" button → Generating spinner → Full audio player
- Full player: play/pause, skip ±10s, scrubable progress bar, time display
- Auto-plays on first generation, ready-to-play state for cached audio
- Cleans up (stops audio) on node navigation

### 5. StoryNodeView Integration

- Browser-native `window.speechSynthesis` removed entirely
- `AudioNarration` component placed between toolbar and story card, visible when `generation_status === 'completed'`
- Audio quota exceeded triggers a dedicated `UpgradePrompt` with `resource="audio"`

### 6. UpgradePrompt

- Added `'audio'` resource type with custom copy
- Free tier: "You've used all your free audio narrations. Upgrade to generate more." (no reset date)
- Paid tier: Shows usage count and reset date

### 7. Tier Config

- Added `audioNarrationsLimit` to `TierConfig` interface
- Updated feature text: FREE "20 audio narrations (one-time)", EXPLORER "60 audio narrations / month", COSMONAUT "200 audio narrations / month"

### 8. Settings Page

- Added `UsageBar` for "Audio Narrations" in the usage section
- Free tier gets a note: "Free audio narrations do not reset. Upgrade for more."

---

## Sequence Diagram

```
User clicks "Play Audio" on a completed story node
  │
  ├─ node.audio_url exists?
  │   ├─ YES → Play the MP3 directly (no API call)
  │   └─ NO  → POST /worlds/{worldId}/nodes/{nodeId}/audio
  │              │
  │              ├─ 200 → { audio_url: "https://cdn.../audio/..." }
  │              │         Update local node state, begin playback
  │              │
  │              ├─ 429 → Quota exceeded → Show UpgradePrompt
  │              │
  │              ├─ 400 → Node text not ready (shouldn't happen if button is disabled properly)
  │              │
  │              └─ 500 → Generation failed → Show error toast
```

---

## Notes

- Audio generation takes ~1-3 seconds. The UI should show a loading/spinner state during this time.
- The returned `audio_url` is permanent — once generated, it never expires or changes. The frontend can cache it freely.
- The endpoint is idempotent: calling it multiple times for the same node always returns the same URL and only consumes quota once.
- Audio files are MP3 format, typically 100-300KB for a story node.
