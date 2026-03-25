<script lang="ts">
	import { Rocket, MessageSquare, Mail, LogIn } from '@lucide/svelte';

	interface Props {
		isAuthenticated?: boolean;
	}

	let { isAuthenticated = false }: Props = $props();
</script>

<footer class="relative overflow-hidden border-t border-border/50">
	<div class="absolute inset-0 bg-linear-to-b from-background via-card/80 to-card"></div>
	<div
		class="pointer-events-none absolute -top-px right-0 left-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent"
	></div>

	<div class="relative mx-auto max-w-7xl px-6 pt-12 pb-8">
		<div class="grid grid-cols-1 gap-10 md:grid-cols-12">
			<div class="md:col-span-5">
				<a href="/" class="group mb-4 inline-flex items-center gap-2.5">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-colors group-hover:border-primary/40 group-hover:bg-primary/15"
					>
						<img src="/logo.png" alt="Cosmonaut logo" class="h-6 w-6" />
					</div>
					<span class="font-orbitron text-lg font-semibold text-foreground">Cosmonaut</span>
				</a>
				<p class="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
					Every choice shapes the narrative. Every world is an adventure waiting to unfold.
				</p>
				<div class="mt-5 flex items-center gap-3">
					{#if isAuthenticated}
						<a
							href="/feedback"
							class="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
						>
							<MessageSquare class="h-3.5 w-3.5" />
							Feedback
						</a>
					{/if}
					<a
						href="mailto:support@cosmonaut-ai.com"
						class="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
					>
						<Mail class="h-3.5 w-3.5" />
						Contact
					</a>
					{#if !isAuthenticated}
						<a
							href="/login"
							class="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
						>
							<LogIn class="h-3.5 w-3.5" />
							Get Started
						</a>
					{/if}
				</div>
			</div>

			<div class="md:col-span-7">
				<div class="grid grid-cols-2 gap-8 sm:grid-cols-3">
					<div>
						<h3 class="mb-3 text-xs font-semibold tracking-wider text-foreground/80 uppercase">
							Product
						</h3>
						<ul class="space-y-2.5">
							{#if isAuthenticated}
								<li>
									<a
										href="/dashboard"
										class="text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										Dashboard
									</a>
								</li>
							{/if}
							<li>
								<a
									href="/pricing"
									class="text-sm text-muted-foreground transition-colors hover:text-primary"
								>
									Pricing
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-3 text-xs font-semibold tracking-wider text-foreground/80 uppercase">
							Company
						</h3>
						<ul class="space-y-2.5">
							<li>
								<a
									href="/about"
									class="text-sm text-muted-foreground transition-colors hover:text-primary"
								>
									About
								</a>
							</li>
							<li>
								<a
									href="/privacy"
									class="text-sm text-muted-foreground transition-colors hover:text-primary"
								>
									Privacy
								</a>
							</li>
							<li>
								<a
									href="/terms"
									class="text-sm text-muted-foreground transition-colors hover:text-primary"
								>
									Terms
								</a>
							</li>
						</ul>
					</div>
					{#if isAuthenticated}
						<div class="col-span-2 sm:col-span-1">
							<h3 class="mb-3 text-xs font-semibold tracking-wider text-foreground/80 uppercase">
								Explore
							</h3>
							<ul class="space-y-2.5">
								<li>
									<a
										href="/worlds/new"
										class="group/link inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										<Rocket
											class="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5"
										/>
										Create a World
									</a>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div
			class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row"
		>
			<p class="text-xs text-muted-foreground/70">
				© {new Date().getFullYear()} Matson Software LLC
			</p>
			<p class="text-xs text-muted-foreground/50">Crafted for storytellers & dreamers</p>
		</div>
	</div>
</footer>
