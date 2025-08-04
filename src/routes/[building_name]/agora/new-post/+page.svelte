<script lang="ts">
	import type { PageData } from '../new_post/$types';
	import { goto } from '$app/navigation';
	import { db, storage, auth } from '$lib/database/firebaseConfig';
	import { addDoc, collection } from 'firebase/firestore';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { onMount } from 'svelte';

	export let data: PageData;
	let { building_name } = data;

	let title = '';
	let content = '';
	let tag = '일반';
	let imageFile: File | null = null;
	let isLoading = false;
	let currentUser: any = null;

	onMount(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			if (user) {
				currentUser = user;
			} else {
				// Redirect to login or handle unauthenticated user
				goto('/login');
			}
		});
		return unsubscribe;
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
			let imageUrl = '';
			if (imageFile) {
				const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
				await uploadBytes(storageRef, imageFile);
				imageUrl = await getDownloadURL(storageRef);
			}

			await addDoc(collection(db, 'posts'), {
				building_name,
				title,
				content,
				tag,
				author_id: currentUser.uid,
				author: currentUser.displayName || 'Anonymous',
				post_photo_url: imageUrl,
				created_at: new Date()
			});

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

