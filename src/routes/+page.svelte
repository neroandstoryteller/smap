<script lang="ts">
	import { goto } from '$app/navigation';
	let schoolName = '';
	let schoolList: any[] = [];
	let isLoading = false;
	let error: string | null = null;

	async function searchSchool() {
		if (!schoolName.trim()) {
			error = '학교 이름을 입력해주세요.';
			return;
		}
		isLoading = true;
		error = null;
		schoolList = [];
		try {
			const response = await fetch(`/api/search?name=${encodeURIComponent(schoolName)}`);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || '학교 검색에 실패했습니다.');
			}
			schoolList = await response.json();
			if (schoolList.length === 0) {
				error = '검색된 학교가 없습니다.';
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	function goToSchoolPage(school: { name: string }) {
		goto(`/${encodeURIComponent(school.name)}`);
	}
</script>

<svelte:head>
	<title>학교 검색</title>
</svelte:head>

<main>
	<h1>학교 검색</h1>
	
	<div class="search-form">
		<input
			type="text"
			bind:value={schoolName}
			on:keydown={(e) => e.key === 'Enter' && searchSchool()}
			placeholder="학교 이름을 입력하세요 (예: 광명고)"
		/>
		<button on:click={searchSchool} disabled={isLoading}>
			{isLoading ? '검색 중...' : '학교 검색'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if schoolList.length > 0}
		<h2>검색 결과:</h2>
		<ul>
			{#each schoolList as school}
				<li>
					<button on:click={() => goToSchoolPage(school)}>
						{school.name} ({school.region})
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		max-width: 800px;
		margin: 2rem auto;
		padding: 1rem;
		font-family: sans-serif;
	}
	.search-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	input {
		flex-grow: 1;
		padding: 0.5rem;
		font-size: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.error {
		color: crimson;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	ul button {
		width: 100%;
		text-align: left;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	pre {
		background-color: #eee;
		padding: 1rem;
		border-radius: 4px;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
</style>
