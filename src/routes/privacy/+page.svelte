<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
</script>

<SEO
	title="Privacy Policy - Cosmonaut"
	description="Privacy Policy for Cosmonaut AI. Learn how we collect, use, and protect your information."
	path="/privacy"
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<article class="prose max-w-none prose-invert">
			<h1>Privacy Policy</h1>
			<p class="lead">
				<strong>Last Updated:</strong> February 7, 2026
			</p>

			<p>
				<strong>Matson Software LLC</strong> ("we," "our," or "us"), doing business as
				<strong>Cosmonaut AI</strong>, respects your privacy and is committed to protecting it
				through our compliance with this policy.
			</p>
			<p>
				This Privacy Policy describes how we collect, use, and share information when you use our
				website, <strong>cosmonaut-ai.com</strong> (the "Service").
			</p>

			<h2>1. Information We Collect</h2>

			<h3>A. Information You Provide to Us</h3>
			<ul>
				<li>
					<strong>Account Information:</strong> When you create an account, we collect your name, email
					address, and password. This data is managed securely via our identity provider (AWS Cognito).
				</li>
				<li>
					<strong>Payment Information:</strong> We do <strong>not</strong> store your credit card
					information. All payment data is processed and stored by our payment processor,
					<strong>Stripe</strong>. We only retain a reference ID (<code>stripe_customer_id</code>)
					to manage your subscription.
				</li>
				<li>
					<strong>User Content (Story Data):</strong> We collect the inputs you provide (e.g., "World"
					descriptions, choices made in stories) to generate content.
				</li>
			</ul>

			<h3>B. Information Collected Automatically</h3>
			<ul>
				<li>
					<strong>Usage Data:</strong> We track your interaction with the Service, including the number
					of worlds created and story nodes generated, to enforce subscription quotas.
				</li>
				<li>
					<strong>Device &amp; Log Data:</strong> We may collect standard server logs (IP address, browser
					type) for security and debugging purposes.
				</li>
			</ul>

			<h2>2. How We Use Your Information</h2>
			<p>We use your information to:</p>
			<ol>
				<li>
					<strong>Provide the Service:</strong> To log you in, manage your subscription, and store your
					reading progress.
				</li>
				<li>
					<strong>Generate Content (AI):</strong> Your story inputs and choices are sent to
					third-party AI models (specifically <strong>Google Gemini and Claude Haiku</strong>) to
					generate text and images.
				</li>
				<li>
					<strong>Improve Consistency:</strong> We use vector databases (<strong>Pinecone</strong>)
					to store "facts" about your stories (e.g., "The King is angry") to ensure narrative
					continuity.
				</li>
				<li>
					<strong>Communication:</strong> To send you transactional emails (receipts, password resets)
					or service updates.
				</li>
			</ol>

			<h2>3. Sharing Your Information (Service Providers)</h2>
			<p>
				We do not sell your personal data. We share data only with the infrastructure providers
				necessary to run the Service:
			</p>
			<ul>
				<li>
					<strong>Amazon Web Services (AWS):</strong> Hosting, database storage, and authentication.
				</li>
				<li>
					<strong>Google (Vertex AI / Gemini):</strong> We send story prompts to Google to generate text
					and images. Google does not use this data to train their models under the Vertex AI enterprise
					API terms.
				</li>
				<li>
					<strong>Pinecone:</strong> Used to store story context and retrieval data.
				</li>
				<li>
					<strong>Stripe:</strong> Payment processing and subscription management.
				</li>
			</ul>

			<h2>4. Children's Privacy</h2>
			<p>
				<strong>Cosmonaut AI is intended for use by parents and legal guardians.</strong> We do not knowingly
				collect personal information directly from children under the age of 13.
			</p>
			<ul>
				<li>
					If you are a parent, you are responsible for the account and for facilitating the
					storytelling experience with your child.
				</li>
				<li>
					We do not ask for or store specific data about children (e.g., their real names or ages)
					unless you voluntarily enter them into a story prompt. We advise against using real
					personally identifiable information in story inputs.
				</li>
			</ul>

			<h2>5. Data Security</h2>
			<p>
				We implement industry-standard security measures, including encryption in transit and at
				rest. However, no method of transmission over the Internet is 100% secure, and we cannot
				guarantee absolute security.
			</p>

			<h2>6. Your Rights</h2>
			<p>Depending on your location, you may have the right to:</p>
			<ul>
				<li>Access the personal data we hold about you.</li>
				<li>Request deletion of your account and data.</li>
				<li>Update or correct your information.</li>
			</ul>
			<p>
				To exercise these rights, email us at
				<a href="mailto:support@cosmonaut-ai.com">support@cosmonaut-ai.com</a>.
			</p>

			<h2>7. Changes to This Policy</h2>
			<p>
				We may update this policy from time to time. If we make material changes, we will notify you
				through the Service or via email.
			</p>

			<hr />

			<p>
				<strong>Contact Us</strong><br />
				Matson Software LLC<br />
				Email: <a href="mailto:support@cosmonaut-ai.com">support@cosmonaut-ai.com</a><br />
				Website: <a href="https://cosmonaut-ai.com">https://cosmonaut-ai.com</a>
			</p>
		</article>
	</main>
</div>
