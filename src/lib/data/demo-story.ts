export interface DemoStoryNode {
	id: string;
	text: string;
	choices?: {
		label: string;
		targetId: string;
	}[];
}

export const demoStory: Record<string, DemoStoryNode> = {
	start: {
		id: 'start',
		text: `The ancient starship *Wanderer* drifts silently through the void, its hull scarred by centuries of cosmic travel. You've been awakened from cryo-sleep by an automated distress signal—something has gone terribly wrong.

The emergency lights cast long shadows across the empty corridor as you step out of your pod. The ship's AI, ARIA, flickers to life on a nearby terminal.

"Crew member detected. Current status: critical. Primary systems offline. Life support at 23%."

You notice two corridors branching ahead. To the left, the bridge pulses with faint blue light. To the right, you hear the rhythmic hum of the engine room.`,
		choices: [
			{ label: 'Head to the bridge to assess the situation', targetId: 'bridge' },
			{ label: 'Investigate the engine room', targetId: 'engine' }
		]
	},

	bridge: {
		id: 'bridge',
		text: `The bridge is a graveyard of shattered screens and twisted metal. Through the fractured viewport, you see something that steals your breath—a massive, bioluminescent structure floats in the void. It pulses with an inner light, organic and alien.

ARIA's voice crackles through damaged speakers: "Unknown biological entity detected. No match in database. It... it's been following us. For how long, I cannot determine."

The entity's tendrils begin to move, reaching toward the ship with deliberate grace. One of the intact consoles beeps—there's still power to the weapons array. Another displays escape pod status: one remaining.`,
		choices: [
			{ label: 'Power up the weapons array', targetId: 'weapons' },
			{ label: 'Make for the escape pod', targetId: 'escape' },
			{ label: 'Try to communicate with the entity', targetId: 'communicate' }
		]
	},

	engine: {
		id: 'engine',
		text: `The engine room thrums with residual power. Banks of equipment line the walls, most dark and silent. But in the center, bathed in amber warning lights, you find the source of your problems.

A crystalline growth has erupted from the main reactor, its faceted surface refracting the emergency lights into scattered rainbows. It's beautiful—and utterly alien. As you watch, it pulses gently, and you feel a strange warmth in your mind.

*Welcome, traveler.* The thought isn't yours. *We have waited so long for one who could hear.*

Your hand drifts toward the crystal. Part of you screams to pull back, but another part feels an inexplicable sense of homecoming.`,
		choices: [
			{ label: 'Touch the crystal', targetId: 'touch_crystal' },
			{ label: 'Back away and return to the corridor', targetId: 'retreat' },
			{ label: 'Try to remove the crystal from the reactor', targetId: 'remove_crystal' }
		]
	},

	weapons: {
		id: 'weapons',
		text: `Your fingers fly across the console, rerouting what little power remains to the weapons array. The entity seems to sense your intent—its tendrils pause, hovering just meters from the hull.

The targeting system locks on. One shot. That's all you'll get.

But as your finger hovers over the firing command, something changes. The entity's glow shifts, patterns emerging on its surface. Not random bioluminescence—*language*. It's trying to speak.

"WAIT." ARIA's voice is different now, touched with something almost like wonder. "I'm detecting a pattern. It's... it's showing us star charts. Coordinates to something called the 'Nexus of Worlds.'"

The weapons system hums, ready to fire.`,
		choices: [
			{ label: 'Fire the weapons', targetId: 'fire' },
			{ label: 'Lower weapons and observe', targetId: 'observe' }
		]
	},

	escape: {
		id: 'escape',
		text: `You sprint through the crumbling corridors, emergency lights flickering overhead. Behind you, you hear the hull groaning as the entity's tendrils make contact with the ship.

The escape pod bay is miraculously intact. The single remaining pod glows with green ready-lights. Safety. Survival. Just twenty meters away.

But then you see it—a child's drawing taped to the wall. A family, crudely rendered in crayon. "CREW MANIFEST" reads a nearby screen. There were others aboard. Families. Children. Where are they now?

The ship shudders violently. You have seconds to decide.`,
		choices: [
			{ label: 'Board the escape pod immediately', targetId: 'escape_alone' },
			{ label: 'Search for other survivors', targetId: 'search_survivors' }
		]
	},

	communicate: {
		id: 'communicate',
		text: `You approach the viewport and press your palm against the cold glass. The entity's tendrils pause their advance. In the depths of its translucent form, lights begin to dance—a response.

You close your eyes and focus on a simple thought: *We mean no harm.*

The response comes not as words, but as images flooding your mind: vast coral-like cities floating between stars, beings of light tending gardens of pure energy, a great darkness consuming world after world. And finally, a single desperate hope—a beacon, lit across the void, searching for allies.

*Your kind was not always alone,* the entity communicates. *Your ancestors built bridges between worlds. We seek to rebuild them.*

The entity's form begins to shift, its tendrils weaving together into something new—a doorway, shimmering with possibility.`,
		choices: [{ label: 'Step through the doorway', targetId: 'doorway_ending' }]
	},

	touch_crystal: {
		id: 'touch_crystal',
		text: `The moment your fingers brush the crystal's surface, the universe unfolds.

You see the Wanderer's true mission—not exploration, but reunion. Your ancestors seeded the stars with pieces of a vast crystalline network, a communication system spanning galaxies. But something went wrong. The network shattered. The connections broke. And humanity forgot.

Until now.

The crystal shows you the way to restore it. Coordinates burn into your memory—the Nexus of Worlds, where the broken pieces might be rejoined. The warmth in your mind blooms into something like joy.

*You remember now,* the presence whispers. *Welcome home, child of the stars.*

You wake in your cryo-pod, the ship humming with renewed power. The crystal pulses gently nearby, no longer a parasite but a compass. And ahead, the first of many journeys awaits.`,
		choices: []
	},

	observe: {
		id: 'observe',
		text: `You lower your hand from the firing command. The weapons array powers down with a disappointed whine.

The entity's communication intensifies. Star charts cascade across every functioning screen—not just coordinates, but *histories*. Civilizations that rose and fell. Worlds that bloomed and died. And connecting them all, like threads in a cosmic tapestry, pathways of light.

"The Nexus of Worlds," ARIA breathes, processing faster than you've ever heard. "It's real. A junction point for... for everything. Every world. Every story. Every possibility."

The entity extends a tendril—not to attack, but to offer. Within its translucent form, a doorway takes shape, glimmering with stars you don't recognize.

*Will you explore with us?*

Your answer will echo across the cosmos.`,
		choices: []
	},

	fire: {
		id: 'fire',
		text: `The weapon fires.

Light erupts across the void as the plasma bolt strikes true. The entity convulses, its bioluminescence flickering erratically. For a moment, you feel a surge of triumph.

Then the sorrow hits you. Not your own—*its*. In its dying moments, the entity broadcasts one final message: an image of the Wanderer surrounded by dozens of vessels just like it, all converging on a point of brilliant light. Your ship wasn't being hunted. It was being guided.

The entity's light fades to nothing. The star charts disappear from your screens. Whatever destination awaited—whatever wonders lay at the Nexus of Worlds—that path is now closed to you.

ARIA's voice is quiet. "Returning to standard navigation. Shall I plot a course for the nearest human colony?"

The stars outside seem colder now. Emptier.`,
		choices: []
	},

	doorway_ending: {
		id: 'doorway_ending',
		text: `You step through the doorway of light.

Reality bends around you—colors you've never seen, sounds that taste like music, the warmth of a thousand suns filtered through infinite prisms. And then you're standing somewhere else entirely.

A vast chamber stretches before you, its walls alive with constellations. Beings of every imaginable form move through the space: crystalline entities, creatures of pure energy, figures that seem human but shimmer with inner light. And at the center, a great tree of stars grows from the floor to the infinite ceiling—the Nexus of Worlds itself.

An ancient figure approaches, their form shifting between human and something far older.

"Welcome, Wanderer. Your journey through the stories has only begun."

The universe opens before you, infinite and waiting.`,
		choices: []
	},

	retreat: {
		id: 'retreat',
		text: `You back away from the crystal, its warmth fading from your mind like a half-remembered dream. The presence doesn't pursue you—it simply watches, patient and eternal.

In the corridor, you find ARIA waiting on a terminal screen.

"That crystal is the source of our problems," she says, "but also, perhaps, our salvation. It's not damaging the ship—it's *changing* it. Preparing it for something."

Distant rumbling echoes through the hull. Outside the nearest porthole, you see the void filling with light—other ships emerging from nowhere, all bearing the same crystalline growths.

"We're not alone," ARIA whispers. "We never were. The question is: will you lead them, or run from them?"

The corridor branches once more. One path leads back to the crystal. The other, to the escape pods.`,
		choices: [
			{ label: 'Return to the crystal', targetId: 'touch_crystal' },
			{ label: 'Make for the escape pods', targetId: 'escape' }
		]
	},

	remove_crystal: {
		id: 'remove_crystal',
		text: `You grasp the crystal and pull. It doesn't budge. You pull harder, bracing your feet against the reactor housing, and feel it begin to give.

*Please,* the voice in your mind pleads. *You don't understand—*

The crystal tears free with a sound like breaking glass and screaming stars. The reactor's amber lights turn red. Alarms blare. And in your hands, the crystal goes dark.

ARIA's voice cuts through the chaos: "Reactor breach imminent. You have ninety seconds to reach an escape pod."

As you run, cradling the dead crystal, you feel an absence where the warmth once lived. Whatever secrets it held, whatever connections it offered—they're gone now, shattered by fear.

The escape pod launches into the void. The Wanderer erupts behind you in a silent flower of fire.

You survived. But at what cost?`,
		choices: []
	},

	escape_alone: {
		id: 'escape_alone',
		text: `The pod seals behind you with a hiss of pressurized air. Through the tiny viewport, you watch the Wanderer grow smaller, its hull now completely wrapped in the entity's luminous tendrils.

The ship doesn't explode. It *transforms*—flowing into new shapes, melding with the entity until you can't tell where one ends and the other begins. Then, with a flash of light that burns itself into your retinas, they vanish.

Your distress beacon pulses steadily. Someone will find you. Eventually.

In the silence of the pod, you wonder about the others. About the entity's message. About the Nexus of Worlds and the star charts you'll never see again.

You survived. But survival, you're beginning to understand, isn't always the same as winning.

The stars wheel overhead, indifferent and eternal.`,
		choices: []
	},

	search_survivors: {
		id: 'search_survivors',
		text: `You turn from the escape pod and run deeper into the ship.

The cryo-bay is chaos—pods scattered, their occupants long gone. But in the corner, beneath a collapsed beam, you find them: a woman clutching two children, all awake, all terrified.

"We heard the alarms," she whispers. "We didn't know what to do."

Together, you make it back to the escape bay. The entity's tendrils have pierced the hull now, spreading across the walls in intricate patterns. But they part as you approach, creating a path to the pod.

*Protect them,* the presence whispers in your mind. *Guide them to the light.*

The pod is designed for one. It fits four, if barely. As you launch into the void, you see the Wanderer begin its transformation, and you understand—the entity was never the threat.

It was the test.

And you passed.`,
		choices: []
	}
};

export const startNodeId = 'start';
