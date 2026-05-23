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
		text: `Mara is brushing her teeth when the bathroom mirror fogs over and writes a sentence by itself:

*The moon has misplaced its name.*

Her little brother Theo stops humming. The house is quiet except for rain tapping the kitchen skylight and the old radiator knocking like someone polite at a door.

On the windowsill sits a silver thimble that nobody remembers putting there. Inside it is a curled paper ladder, no longer than a shoelace. Outside, the moon hangs low over the alley, pale and worried, as if it has forgotten what to be called.`,
		choices: [
			{ label: 'Unroll the tiny ladder and see where it reaches', targetId: 'ladder' },
			{ label: 'Ask the moon what name it remembers first', targetId: 'ask_moon' }
		]
	},

	ladder: {
		id: 'ladder',
		text: `Mara carries the thimble to the kitchen table. Theo brings the jam jar, because every important expedition, he says, needs supplies.

The paper ladder grows when Mara touches it. First the length of a scarf. Then a clothesline. Then it slips out the window and hooks itself to a cloud with the tidy confidence of a librarian shelving a book.

Halfway up, they find a post office made from bird nests and brass buttons. A sleepy clerk in a raincoat stamps envelopes with constellations.

"Names go missing all the time," the clerk says. "Usually they hide in places where someone said them with love."`,
		choices: [
			{ label: 'Search the moon-mail sacks for a familiar name', targetId: 'mail_sacks' },
			{ label: 'Climb past the post office toward the moon', targetId: 'moon_roof' }
		]
	},

	ask_moon: {
		id: 'ask_moon',
		text: `"Do you remember anything?" Mara whispers through the open window.

The moon lowers itself until its light fills the sink and turns every spoon in the drying rack into a small bright boat.

*"I remember being called home by wolves,"* says the moon. *"I remember sailors looking up when they were lost. I remember a baby in apartment 4B waving with both hands. But the name itself is gone."*

Theo pulls his pajama sleeves over his hands. "Maybe names are like socks. They go missing because they are having adventures."

The moon considers this gravely. A single silver thread drops from the sky and lands across the windowsill.`,
		choices: [
			{
				label: 'Follow the silver thread through the sleeping building',
				targetId: 'silver_thread'
			},
			{ label: 'Collect every name the moon can still remember', targetId: 'remembered_names' }
		]
	},

	mail_sacks: {
		id: 'mail_sacks',
		text: `The mail sacks are full of names written on things that nearly blew away: a theater ticket, a grocery list, the corner of a birthday card, a napkin with soup on it.

Mara finds a blue envelope addressed to "The Light We Leave On." Theo finds one addressed to "Round Lantern, Sky Department." Neither is quite right, but both glow when held near the window.

At the bottom of the sack is a note in their mother's handwriting from years ago, written before Theo could read:

*Moon, please watch my children while they sleep.*

The letters warm Mara's palm. The post office falls respectfully quiet.`,
		choices: [{ label: 'Carry the note to the moon', targetId: 'name_returned' }]
	},

	moon_roof: {
		id: 'moon_roof',
		text: `They climb until the city is a quilt of windows below them. On the roof of the moon, dust rises around their slippers.

There is a door there, painted the exact yellow of their hallway light. Behind it they hear every goodnight ever said at once: rushed ones, sleepy ones, sung ones, ones whispered by grandparents over video calls, ones spoken into empty rooms by people who hope they are still heard.

"A name is not just what you call a thing," Mara says slowly. "It is what answers when you need it."

The moon brightens, as if it has been holding its breath for a hundred years.`,
		choices: [{ label: 'Open the yellow door together', targetId: 'name_returned' }]
	},

	silver_thread: {
		id: 'silver_thread',
		text: `The thread leads under their parents' bedroom door, past the laundry basket, and into the hall closet where winter coats sleep through summer.

Inside the smallest mitten, Theo finds a pebble. The pebble is warm. When Mara holds it to her ear, she hears their father on a camping trip, pointing upward and saying, "That one keeps watch when we cannot."

The words are not the moon's old name. They are better: a clue left by someone who did not know he was leaving one.

The thread tugs them back toward the window, eager as a kite.`,
		choices: [{ label: 'Bring the warm pebble back to the moon', targetId: 'name_returned' }]
	},

	remembered_names: {
		id: 'remembered_names',
		text: `Mara writes while the moon remembers.

Night coin. Tide-puller. Window friend. Silver pancake. The porch lamp of the sea. Theo adds "Big Cheese" and refuses to cross it out.

The list becomes so long it slides off the kitchen table and winds around the chair legs. Each name is wrong by itself, but together they make the room feel less afraid.

At the very end, Mara writes the name her mother uses when she comes in to check on them after bedtime:

*our old moon.*

Outside, the sky goes still.`,
		choices: [{ label: 'Read the whole list aloud', targetId: 'name_returned' }]
	},

	name_returned: {
		id: 'name_returned',
		text: `The moon listens.

Not to one perfect answer, but to all the small almost-answers: the note, the pebble, the silly names, the goodnights caught behind the yellow door. Its light gathers them up the way a blanket gathers knees and feet.

*"Yes,"* says the moon at last. *"That is close enough to come home."*

In the morning, the thimble is back in the sewing tin. The mirror is ordinary. Rain slides down the window.

But that night, when Mara and Theo look up, the moon is exactly where it should be, wearing every name anyone has ever loved it by.`,
		choices: []
	}
};

export const startNodeId = 'start';
