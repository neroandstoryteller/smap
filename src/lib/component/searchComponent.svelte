<script lang="ts">
	import { goto } from '$app/navigation';
    import { slide } from 'svelte/transition';
	import { school, setSchoolName } from '$lib/store/schoolDataStore';

	let selectedSchoolName = $derived($school.buildingName);

	let buildingName = $state('');
	let schoolList: any[] = $state([]);
	let isLoading = $state(false);
	let error: string | null = $state(null);

	async function searchSchool() {
		if (!buildingName.trim()) {
			error = '학교 이름을 입력해주세요.';
			return;
		}
		isLoading = true;
		error = null;
		schoolList = [];
		try {
			const response = await fetch(`/api/search?name=${encodeURIComponent(buildingName)}`);
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
		goto(`/map/${encodeURIComponent(school.name)}`);
	}

	function applySelectedSchoolName(school: { name: string }){
		setSchoolName(school.name);
	}

</script>

<div class="search-flexbox">
	<div class="search-bubble">
		<h1>학교 검색</h1>
		{#if selectedSchoolName}
			<h2>선택된 학교: {selectedSchoolName}</h2>
		{/if}		
		<div class="search-form">
			<input
				type="text"
				bind:value={buildingName}
				onkeydown={(e) => e.key === 'Enter' && searchSchool()}
				placeholder="학교 이름을 입력하세요 (예: 서천고)"
			/>
			<button onclick={searchSchool} disabled={isLoading} class="sumbit-button">
				{isLoading ? '검색 중...' : '학교 검색'}
			</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if schoolList.length > 0}
			<h1>검색 결과:</h1>
			<ul transition:slide>
				{#each schoolList as school}
					<li>
						<button onclick={() => applySelectedSchoolName(school)}>
							{school.name} ({school.region})
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$lib/style/main.scss' as *;

	.search-flexbox{
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-bubble{
		width: 100%;
		max-width: 600px;
		padding: 45px;
		border-radius: 10px;
	}

	h1 {
		@include typography-heading;
		color: $color-text-primary;
	}

	h2{
		@include typography-body;
		color: $color-text-primary;
	}

	.search-form {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	input {
		font-size: 20px;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid $colorMedium;
		border-radius: 6px;
		background-color: $colorWhite;
		box-shadow: $boxShadow;
		transition: $transition border-color, $transition box-shadow, $transition transform;

		// 플레이스홀더 스타일
		&::placeholder {
			@include typography-body;
			color: $color-text-tertiary;
			opacity: 0.7;
		}

		// 포커스 상태
		&:focus {
			outline: none;
			border-color: $colorSymbolGreen;
			box-shadow: 0 0 10px rgba($colorSymbolGreen, 0.3);
			transform: translateY(-2px); // 약간의 떠오르는 효과
		}

		// 호버 상태
		&:hover:not(:disabled) {
			border-color: $colorSymbolGreen;
			background-color: $colorBrighter;
		}

		// 비활성화 상태
		&:disabled {
			background-color: $colorMediumBright;
			border-color: $colorMediumDarker;
			color: $color-text-tertiary;
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.sumbit-button {
		@include typography-body-bold;
		padding: 5px;
		width: 120px;
		border: none;
		border-radius: 4px;
		background: $gradient;
		color: $color-text-inverse;
		cursor: pointer;
		transition: $transition;
		box-shadow: $boxShadow;

		&:hover:not(:disabled) {
			filter: brightness(1.1);
			transform: translateY(-2px);
		}

		&:disabled {
			background: $colorMedium;
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.error {
		@include typography-body;
		color: $color-text-error;
		margin: 1rem 0;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		margin-bottom: 0.75rem;
	}

	li button {
		@include typography-body;
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		border: 1px solid $colorMediumBright;
		border-radius: 4px;
		background-color: $colorBrighter;
		transition: $transition;

		&:hover {
			background-color: $colorWhite;
			border-color: $colorSymbolGreen;
			color: $colorSymbolGreen;
		}
	}
</style>