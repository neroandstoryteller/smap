<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { db, storage } from '$lib/database/firestore';
	import { addDoc, collection } from 'firebase/firestore';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { user } from '$lib/store/user';
	import type { User } from 'firebase/auth';

	export let data: PageData;
	let { building_name } = data;

	let title = '';
	let content = '';
	let tag = '일반';
	let imageFile: File | null = null;
	let isLoading = false;
	let is_event = false;
	let event_date = '';
	let event_room = '';

	let currentUser: User | null | undefined;
	user.subscribe((value) => {
		currentUser = value;
	});

	const handleImageUpload = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			imageFile = target.files[0];
		}
	};

	const handleSubmit = async () => {
		if (!title || !content || !currentUser) {
			alert('제목과 내용을 모두 입력해주세요.');
			return;
		}

		isLoading = true;

		try {
			let imageUrl = 'default.jpg';
			if (imageFile) {
				const storageRef = ref(storage, `post-images/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
				await uploadBytes(storageRef, imageFile);
				imageUrl = await getDownloadURL(storageRef);
			}

			const postData: any = {
				building_name,
				title,
				content,
				tag,
				author_id: currentUser.uid,
				author: currentUser.displayName || 'Anonymous',
				post_photo_url: imageUrl,
				created_at: new Date(),
				is_event
			};

			if (is_event) {
				postData.event_date = new Date(event_date);
				postData.event_room = event_room;
			}

			await addDoc(collection(db, 'posts'), postData);

			alert('포스트가 성공적으로 등록되었습니다.');
			goto(`/${building_name}/agora`);
		} catch (error) {
			console.error('Error adding document: ', error);
			alert('포스트 등록에 실패했습니다.');
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="new-post-container">
	<h1>새 포스트 작성</h1>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title">제목</label>
			<input type="text" id="title" bind:value={title} required />
		</div>

		<div class="form-group">
			<label for="tag">태그</label>
			<select id="tag" bind:value={tag}>
				<option value="일반">일반</option>
				<option value="질문">질문</option>
				<option value="공지">공지</option>
			</select>
		</div>

		<div class="form-group">
			<label>
				<input type="checkbox" bind:checked={is_event} />
				이벤트
			</label>
		</div>

		{#if is_event}
			<div class="form-group">
				<label for="event_date">이벤트 날짜</label>
				<input type="datetime-local" id="event_date" bind:value={event_date} required />
			</div>
			<div class="form-group">
				<label for="event_room">이벤트 장소</label>
				<input type="text" id="event_room" bind:value={event_room} required />
			</div>
		{/if}

		<div class="form-group">
			<label for="content">내용</label>
			<textarea id="content" bind:value={content} rows="10" required />
		</div>

		<div class="form-group">
			<label for="image">이미지 업로드</label>
			<input type="file" id="image" on:change={handleImageUpload} accept="image/*" />
		</div>

		<button type="submit" disabled={isLoading}>
			{isLoading ? '등록 중...' : '포스트 등록'}
		</button>
	</form>
</div>

<style lang="scss">
	.new-post-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #eee;
		border-radius: 8px;
		font-family: sans-serif;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;

		label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: bold;
		}

		input,
		select,
		textarea {
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #ccc;
			border-radius: 4px;
			font-size: 1rem;
		}

		textarea {
			resize: vertical;
		}
	}

	button {
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: background-color 0.2s;

		&:hover {
			background-color: #0056b3;
		}

		&:disabled {
			background-color: #aaa;
			cursor: not-allowed;
		}
	}
</style>

