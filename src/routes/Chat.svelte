<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { initializeApp } from "firebase/app";
    import { getFunctions, httpsCallable } from "firebase/functions";

    // Firebase 구성 정보 (Firebase 콘솔에서 가져오세요)
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);

    let messages = $state([
        { id: 1, text: "안녕하세요! 무엇을 도와드릴까요?", sender: "ai" },
    ]);

    let newMessage = $state("");
    let isLoading = $state(false);

    async function sendMessage() {
        if (newMessage.trim() === "") return;
        
        // Add user message
        messages = [...messages, { id: Date.now(), text: newMessage, sender: "user" }];
        const userMessage = newMessage;
        newMessage = "";
        isLoading = true;

        try {
            // Genkit을 사용한 AI 응답 가져오기
            const aiResponse = await getAIResponse(userMessage);
            messages = [...messages, { id: Date.now(), text: aiResponse, sender: "ai" }];
        } catch (error) {
            messages = [...messages, { 
                id: Date.now(), 
                text: "죄송합니다, 응답을 생성하는 중 오류가 발생했습니다.", 
                sender: "ai" 
            }];
        } finally {
            isLoading = false;
        }
    }

    // Genkit flow를 호출하는 AI 응답 함수
    async function getAIResponse(message: string): Promise<string> {
        // Genkit flow 이름 (서버 측에서 정의된 flow 이름으로 변경하세요, 예: 'chatFlow')
        const genkitFlow = httpsCallable(functions, 'chatFlow'); // Genkit flow 이름으로 대체

        try {
            const result:any = await genkitFlow({ prompt: message }); // flow 입력에 맞게 조정
            return result.data.text || "Genkit 응답: " + message; // flow 출력 형식에 맞게 추출
        } catch (error) {
            console.error("Genkit 호출 오류:", error);
            throw error;
        }
    }
</script>

<div class="chat-container">
    <div class="messages">
        {#each messages as message (message.id)}
            <div class="message {message.sender}" transition:slide>
                {message.text}
            </div>
        {/each}
        {#if isLoading}
            <div class="message ai loading" transition:fade>
                <span class="loading-dots">...</span>
            </div>
        {/if}
    </div>
    <div class="input-area">
        <input 
            type="text" 
            bind:value={newMessage} 
            placeholder="메시지를 입력하세요..." 
            onkeydown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
        >
        <button onclick={sendMessage} disabled={isLoading}>전송</button>
    </div>
</div>

<style lang="scss">
    @use '$lib/style/main.scss' as *;

    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: $colorBrighter;
    }

    .messages {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .message {
        padding: 10px 15px;
        border-radius: $borderRadius;
        max-width: 80%;
        word-wrap: break-word;
        @include typography-body;
        box-shadow: $boxShadow;

        &.user {
            background-color: $colorMediumBright;
            align-self: flex-end;
            color: $color-text-primary;
        }

        &.ai {
            background-color: $colorWhite;
            border: 1px solid $colorMedium;
            align-self: flex-start;
            color: $color-text-secondary;

            &.loading {
                font-style: italic;
                color: $color-text-tertiary;
            }
        }
    }

    .loading-dots {
        display: inline-block;
        width: 20px;
        text-align: center;
        animation: dots 1.5s infinite;
    }

    @keyframes dots {
        0% { content: '.'; }
        33% { content: '..'; }
        66% { content: '...'; }
        100% { content: '.'; }
    }

    .input-area {
        display: flex;
        padding: 10px;
        border-top: 1px solid $colorMedium;
        background-color: $colorWhite;

        input {
            @include typography-small;
            margin: 5px;
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid $colorMedium;
            border-radius: 6px;
            background-color: $colorWhite;
            box-shadow: $boxShadow;
            transition: $transition border-color, $transition box-shadow, $transition transform;

            &::placeholder {
                color: $color-text-tertiary;
                opacity: 0.7;
            }

            &:focus {
                outline: none;
                border-color: $colorSymbolGreen;
                box-shadow: 0 0 10px rgba($colorSymbolGreen, 0.3);
                transform: translateY(-2px);
            }

            &:hover:not(:disabled) {
                border-color: $colorSymbolGreen;
                background-color: $colorBrighter;
            }

            &:disabled {
                background-color: $colorMediumBright;
                border-color: $colorMediumDarker;
                color: $color-text-tertiary;
                cursor: not-allowed;
                opacity: 0.6;
            }
        }

        button {
            @include typography-body-bold;
            margin: 5px;
            padding: 5px;
            width: 80px;
            border: none;
            border-radius: 6px;
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
    }
</style>