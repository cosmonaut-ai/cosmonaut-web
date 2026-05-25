# Components

## Buttons

### Primary (Gold CTA)

```svelte
<Button>Begin Your Journey</Button>
```

- Background: `bg-primary`
- Text: `text-primary-foreground`
- Hover: Subtle glow effect
- Use for: Main actions, sign up, create world

### Secondary

```svelte
<Button variant="secondary">Learn More</Button>
```

- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Use for: Alternative actions, cancel, back

### Ghost

```svelte
<Button variant="ghost">Sign In</Button>
```

- Background: Transparent
- Text: `text-foreground`
- Hover: `bg-secondary`
- Use for: Navigation, subtle actions

### Outline

```svelte
<Button variant="outline">View Map</Button>
```

- Border: `border-primary`
- Text: `text-primary`
- Use for: Secondary prominent actions

---

## Cards

### World Card

Used for displaying story worlds in grids.

```svelte
<Card class="group transition-colors hover:border-primary/50">
	<div class="h-48 bg-gradient-to-br from-primary/20 to-accent/10" />
	<CardHeader>
		<CardTitle>World Title</CardTitle>
		<CardDescription>Genre • Author</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="line-clamp-2 text-muted-foreground">Description...</p>
	</CardContent>
</Card>
```

### Story Node Card

Used for displaying narrative content.

```svelte
<Card class="border-l-4 border-l-primary">
	<CardContent class="font-mono">Story text here...</CardContent>
</Card>
```

---

## Form Elements

All inputs use the shadcn defaults which map to our theme:

- Background: `bg-background`
- Border: `border-input`
- Focus ring: `ring-ring`

### Form Pattern

```svelte
<form onsubmit={handleSubmit}>
	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="name">Name</Label>
			<Input id="name" bind:value={name} />
		</div>
		<div class="space-y-2">
			<Label for="description">Description</Label>
			<Textarea id="description" bind:value={description} />
		</div>
		<Button type="submit">Submit</Button>
	</div>
</form>
```
