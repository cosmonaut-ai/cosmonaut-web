# Cosmonaut API Reference

## Base URL

```
http://localhost:8000
```

## Overview

The Cosmonaut API provides endpoints for creating and navigating interactive story worlds. The API is organized around two main resources:

- **Worlds**: Story universes with their own lore, settings, and characters
- **Story Nodes**: Individual story segments that form a branching narrative tree

---

## Health Check

### GET /health

Check if the API is running.

**Response**

```json
{
	"status": "ok"
}
```

---

## Worlds

### GET /worlds

List all available worlds.

**Response**

```json
[
	{
		"id": "world_123",
		"title": "The Crystal Caverns",
		"description": "A mysterious underground world filled with glowing crystals",
		"genre": "fantasy",
		"generation_status": "completed",
		"author_id": "user_456",
		"root_node_id": "node_789",
		"visibility": "public",
		"world_prompt": "A fantasy world set in underground crystal caverns",
		"setting": "Underground crystal caverns with bioluminescent flora",
		"characters": ["Aria the Explorer", "Zeph the Guide"],
		"potential_endings": ["Find the heart crystal", "Escape to the surface"],
		"story_background": "Long ago, a civilization thrived beneath the earth...",
		"narrator_profile": "mysterious and atmospheric",
		"node_text_length": 300,
		"world_image_url": "https://example.com/image.jpg",
		"world_image_alt_text": "Crystal caverns glowing blue",
		"created_at": "2025-01-15T10:30:00Z",
		"updated_at": "2025-01-15T11:00:00Z"
	}
]
```

**Status Codes**

- `200 OK`: Success

---

### GET /worlds/{world_id}

Get details for a specific world.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Response**

```json
{
	"id": "world_123",
	"title": "The Crystal Caverns",
	"description": "A mysterious underground world filled with glowing crystals",
	"genre": "fantasy",
	"generation_status": "completed",
	"root_node_id": "node_789",
	"visibility": "public",
	"world_prompt": "A fantasy world set in underground crystal caverns",
	"setting": "Underground crystal caverns with bioluminescent flora",
	"characters": ["Aria the Explorer", "Zeph the Guide"],
	"potential_endings": ["Find the heart crystal", "Escape to the surface"],
	"story_background": "Long ago, a civilization thrived beneath the earth...",
	"narrator_profile": "mysterious and atmospheric",
	"node_text_length": 300,
	"created_at": "2025-01-15T10:30:00Z",
	"updated_at": "2025-01-15T11:00:00Z"
}
```

**Status Codes**

- `200 OK`: Success
- `404 Not Found`: World not found

---

### POST /worlds/init

Create a new world. This initializes the world but doesn't generate lore or story nodes yet.

**Request Body**

```json
{
	"world_prompt": "A cyberpunk city where AI and humans coexist",
	"narrator_profile": "gritty and noir",
	"node_text_length": 250,
	"visibility": "private"
}
```

**Request Fields**

- `world_prompt` (string, required): Description of the world you want to create
- `narrator_profile` (string, optional): The narrative voice/style for the story
- `node_text_length` (integer, optional): Target length for story node text
- `visibility` (string, optional): "public" or "private" (defaults to "private")

**Response**

```json
{
	"id": "world_456",
	"world_prompt": "A cyberpunk city where AI and humans coexist",
	"narrator_profile": "gritty and noir",
	"node_text_length": 250,
	"visibility": "private",
	"generation_status": "initialized",
	"created_at": "2025-01-15T12:00:00Z"
}
```

**Status Codes**

- `201 Created`: World successfully created

---

### POST /worlds/{world_id}/generate-lore

Generate lore for an initialized world. This uses AI to create the world's setting, characters, and story background.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Response**

```json
{
	"id": "world_456",
	"title": "Neon Shadows",
	"description": "A cyberpunk metropolis where the line between human and machine blurs",
	"genre": "cyberpunk",
	"generation_status": "generating_lore",
	"setting": "Neo-Tokyo, 2087. Towering skyscrapers pierce the smog...",
	"characters": ["Detective Ray Chen", "AI Oracle Nexus"],
	"potential_endings": ["Expose the conspiracy", "Join the resistance"],
	"story_background": "After the Great Integration of 2075...",
	"created_at": "2025-01-15T12:00:00Z",
	"updated_at": "2025-01-15T12:05:00Z"
}
```

**Status Codes**

- `200 OK`: Lore generation started/completed
- `404 Not Found`: World not found

---

### POST /worlds/{world_id}/generate-start-node

Generate the first story node for a world. This creates the opening scene of your story.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Response**

```json
{
	"id": "world_456",
	"title": "Neon Shadows",
	"generation_status": "completed",
	"root_node_id": "node_001",
	"created_at": "2025-01-15T12:00:00Z",
	"updated_at": "2025-01-15T12:10:00Z"
}
```

**Status Codes**

- `200 OK`: Start node generated successfully
- `404 Not Found`: World not found

---

### PATCH /worlds/{world_id}

Update an existing world's metadata.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Request Body**

```json
{
	"title": "Updated Title",
	"description": "Updated description",
	"visibility": "public"
}
```

**Note**: Only include fields you want to update. All fields are optional.

**Response**

```json
{
	"id": "world_456",
	"title": "Updated Title",
	"description": "Updated description",
	"visibility": "public",
	"updated_at": "2025-01-15T13:00:00Z"
}
```

**Status Codes**

- `200 OK`: World updated successfully
- `404 Not Found`: World not found
- `501 Not Implemented`: Feature not yet available

---

### DELETE /worlds/{world_id}

Delete a world and all associated story nodes.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Response**

- No response body

**Status Codes**

- `204 No Content`: World deleted successfully
- `404 Not Found`: World not found

---

## Story Nodes

### GET /worlds/{world_id}/nodes/

List all story nodes in a world.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world

**Response**

```json
[
	{
		"id": "node_001",
		"world_id": "world_456",
		"title": "The Rain-Soaked Streets",
		"text": "Rain hammers against the neon-lit streets of Neo-Tokyo. You stand at the entrance to the Underground Market, where information flows like water...",
		"story_summary": "The protagonist arrives at the Underground Market",
		"choices": [
			{
				"label": "Enter the market",
				"target": "node_002"
			},
			{
				"label": "Wait and observe",
				"target": "node_003"
			}
		],
		"parent_id": null,
		"ancestors": [],
		"created_at": "2025-01-15T12:10:00Z",
		"updated_at": "2025-01-15T12:10:00Z"
	}
]
```

**Status Codes**

- `200 OK`: Success

---

### GET /worlds/{world_id}/nodes/{node_id}

Get a specific story node.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world
- `node_id` (string, required): The unique identifier for the node

**Response**

```json
{
	"id": "node_002",
	"world_id": "world_456",
	"title": "Inside the Market",
	"text": "The market buzzes with activity. Holographic vendors hawk their wares while shadowy figures exchange encrypted data chips...",
	"story_summary": "The protagonist enters the bustling underground market",
	"choices": [
		{
			"label": "Approach the data vendor",
			"target": null
		},
		{
			"label": "Follow the suspicious figure",
			"target": null
		}
	],
	"parent_id": "node_001",
	"ancestors": ["node_001"],
	"created_at": "2025-01-15T12:15:00Z",
	"updated_at": "2025-01-15T12:15:00Z"
}
```

**Response Fields**

- `id`: Unique identifier for this node
- `world_id`: The world this node belongs to
- `title`: Optional title for this story segment
- `text`: The main story text for this node
- `story_summary`: A brief summary of what happens in this node
- `choices`: Array of available choices for the player
  - `label`: The text displayed for this choice
  - `target`: The ID of the node this choice leads to (null if not yet generated)
- `parent_id`: The ID of the previous node (null for root nodes)
- `ancestors`: Array of all ancestor node IDs in chronological order

**Status Codes**

- `200 OK`: Success
- `404 Not Found`: Node or world not found

---

### POST /worlds/{world_id}/nodes/{node_id}/choose/{choice_index}

Make a choice and generate the next story node. This is the core gameplay endpoint.

**Path Parameters**

- `world_id` (string, required): The unique identifier for the world
- `node_id` (string, required): The current node ID
- `choice_index` (integer, required): The index of the choice to select (0-based)

**Example Request**

```
POST /worlds/world_456/nodes/node_002/choose/0
```

**Response**

```json
{
	"id": "node_003",
	"world_id": "world_456",
	"title": "The Data Vendor",
	"text": "You approach the vendor's stall. Behind the flickering hologram, a woman with cybernetic eyes studies you carefully. 'Looking for something specific?' she asks...",
	"story_summary": "The protagonist meets the data vendor",
	"choices": [
		{
			"label": "Ask about the conspiracy",
			"target": null
		},
		{
			"label": "Request information on Detective Chen",
			"target": null
		},
		{
			"label": "Leave quietly",
			"target": null
		}
	],
	"parent_id": "node_002",
	"ancestors": ["node_001", "node_002"],
	"created_at": "2025-01-15T12:20:00Z",
	"updated_at": "2025-01-15T12:20:00Z"
}
```

**What This Endpoint Does**

1. Validates that the choice index is valid for the current node
2. Uses AI to generate a new story node based on the selected choice
3. Updates the parent node's choice to link to the newly generated node
4. Returns the new node for display

**Status Codes**

- `201 Created`: New node generated successfully
- `400 Bad Request`: Invalid choice index
- `404 Not Found`: Node or world not found

---

## Typical User Flow

### Creating and Playing a Story

1. **Initialize a World**

   ```
   POST /worlds/init
   ```

2. **Generate World Lore**

   ```
   POST /worlds/{world_id}/generate-lore
   ```

3. **Generate Starting Node**

   ```
   POST /worlds/{world_id}/generate-start-node
   ```

4. **Get the Root Node**

   ```
   GET /worlds/{world_id}  (to get root_node_id)
   GET /worlds/{world_id}/nodes/{root_node_id}
   ```

5. **Make Choices and Progress**
   ```
   POST /worlds/{world_id}/nodes/{current_node_id}/choose/{choice_index}
   ```
   Repeat step 5 to continue the story.

### Browsing Existing Worlds

1. **List Available Worlds**

   ```
   GET /worlds
   ```

2. **Get World Details**

   ```
   GET /worlds/{world_id}
   ```

3. **Start Playing from Root Node**
   ```
   GET /worlds/{world_id}/nodes/{root_node_id}
   ```

---

## Data Models

### World Generation Status

The `generation_status` field indicates the current state of world creation:

- `initialized`: World created but no lore generated yet
- `generating_lore`: AI is generating world lore
- `generating_start_node`: AI is generating the first story node
- `completed`: World is fully ready to play

### Choice Structure

Each choice in a story node has:

- `label`: The text shown to the player
- `target`: The node ID this choice leads to (null if not yet generated)

When a choice's `target` is `null`, selecting that choice will generate a new node dynamically.

---

## Error Responses

All error responses follow this format:

```json
{
	"detail": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input (e.g., invalid choice index)
- `404 Not Found`: Resource doesn't exist (world or node not found)
- `501 Not Implemented`: Feature is scaffolded but not yet implemented

---

## Notes for Frontend Developers

### Request Headers

No authentication is currently required. Standard JSON content type:

```
Content-Type: application/json
```

### CORS

Ensure your development environment allows requests to `localhost:8000`.

### Async Operations

World lore and node generation may take several seconds. Consider showing loading states in your UI.

### Choice Indices

Choices are **zero-indexed**. If a node has 3 choices, valid indices are 0, 1, and 2.

### Timestamps

All timestamps are in ISO 8601 format with UTC timezone (e.g., `2025-01-15T12:00:00Z`).

### Null Values

Many fields can be `null`, especially for newly created worlds. Always check for null values before displaying.

### Story Navigation

- Use `parent_id` to implement a "back" button
- Use `ancestors` to show the story path taken
- Store the current `node_id` in your app state to track player progress
