<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const { post } = data;
</script>

<div class="post-detail-container">
	<a href="/{post.building_name}/agora" class="back-link">← Back to Agora</a>
	<h1>{post.title}</h1>
	<div class="post-meta">
		<span>By {post.author}</span>
		<span>on {new Date(post.created_at).toLocaleDateString()}</span>
		{#if post.tag !== '일반'}
			<span class="tag">{post.tag}</span>
		{/if}
	</div>

	{#if post.is_event}
		<div class="event-details">
			<h3>Event Details</h3>
			<p><strong>When:</strong> {new Date(post.event_date).toLocaleString()}</p>
			<p><strong>Where:</strong> {post.event_room}</p>
		</div>
	{/if}

	{#if post.post_photo_url && post.post_photo_url !== 'default.jpg'}
		<img src={post.post_photo_url} alt={post.title} class="post-image" />
	{/if}

	<div class="post-content">
		{@html post.content}
	</div>
</div>

<style lang="scss">
	.post-detail-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		font-family: sans-serif;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: #007bff;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.post-meta {
		display: flex;
		gap: 1rem;
		color: #666;
		margin-bottom: 2rem;
		align-items: center;

		.tag {
			background-color: #eee;
			padding: 0.2rem 0.5rem;
			border-radius: 4px;
			font-size: 0.9rem;
		}
	}

	.event-details {
		background-color: #f9f9f9;
		border: 1px solid #eee;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;

		h3 {
			margin-top: 0;
			font-size: 1.2rem;
		}
	}

	.post-image {
		width: 100%;
		max-height: 400px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.post-content {
		line-height: 1.8;
	}
</style>

