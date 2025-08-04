<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ posts, building_name, tag, skip, limit } = data);
</script>

<div class="agora-container">
	<div class="header">
		<h1>{building_name} Agora</h1>
		<a href="/{building_name}/agora/new-post" class="create-post-button">포스트 만들기</a>
	</div>

	<div class="tabs">
		<a href="?tag=일반" class:active={tag === '일반'}>일반</a>
		<a href="?tag=질문" class:active={tag === '질문'}>질문</a>
		<a href="?tag=공지" class:active={tag === '공지'}>공지</a>
	</div>

	<div class="content">
		<div class="post-list">
			{#each posts as post}
				<a href="/{building_name}/agora/{post.id}" class="post-item-link">
					<div class="post-item">
						<img src={post.post_photo_url} alt={post.title} class="post-image" />
						<div class="post-info">
							<div class="post-header">
								<h2 class="post-title">{post.title}</h2>
								{#if tag === '일반' && post.tag !== '일반'}
									<span class="post-tag">{post.tag}</span>
								{/if}
							</div>
							{#if post.is_event}
								<div class="event-info">
									<span class="event-date">📅 {new Date(post.event_date).toLocaleString()}</span>
									<span class="event-room">📍 {post.event_room}</span>
								</div>
							{/if}
							<p class="post-author">by {post.author}</p>
						</div>
					</div>
				</a>
			{:else}
				<p>No posts in this category yet.</p>
			{/each}
		</div>
	</div>

	<div class="pagination">
		<a href="?tag={tag}&skip={Math.max(0, skip - limit)}&limit={limit}" class="button"
			>{skip - limit}-{skip}</a
		>
		<span class="page-info">{skip + 1}–{skip + posts.length}</span>
		<a href="?tag={tag}&skip={skip + limit}&limit={limit}" class="button"
			>{skip + limit}-{skip + 2 * limit}</a
		>
	</div>
</div>

<style lang="scss">
	.agora-container {
		padding: 2rem;
		font-family: sans-serif;
		width: 800px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
	}

	.create-post-button {
		padding: 0.6rem 1.2rem;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 5px;
		font-weight: bold;
		transition: background-color 0.2s;

		&:hover {
			background-color: #0056b3;
		}
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #ccc;
		margin-bottom: 1rem;

		a {
			padding: 0.5rem 1rem;
			border: none;
			background-color: transparent;
			cursor: pointer;
			font-size: 1rem;
			position: relative;
			bottom: -1px;
			text-decoration: none;
			color: #333;

			&.active {
				border-bottom: 2px solid blue;
				font-weight: bold;
			}
		}
	}

	.post-list {
		display: grid;
		gap: 1rem;
	}

	.post-item-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.post-item {
		display: flex;
		align-items: center;
		border: 1px solid #eee;
		padding: 1rem;
		border-radius: 8px;
		transition: background-color 0.2s;

		&:hover {
			background-color: #f9f9f9;
		}
	}

	.post-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 4px;
		margin-right: 1rem;
	}

	.post-info {
		flex-grow: 1;
	}

	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.5rem;
	}
	
	.post-tag {
		font-size: 0.8rem;
		padding: 0.2rem 0.5rem;
		background-color: #eee;
		border-radius: 4px;
		color: #555;
	}

	.post-title {
		font-size: 1.2rem;
		margin: 0;
	}

	.post-author {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
	}

	.event-info {
		display: flex;
		gap: 1rem;
		font-size: 0.9rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.event-date,
	.event-room {
		display: flex;
		align-items: center;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 2rem;

		.button {
			padding: 0.5rem 1rem;
			border: 1px solid #ccc;
			background-color: #f0f0f0;
			text-decoration: none;
			color: #333;
			border-radius: 4px;
			margin: 0 0.5rem;
		}

		.page-info {
			margin: 0 1rem;
			font-weight: bold;
		}
	}
</style>
