<script lang="ts">
    import { fade } from "svelte/transition";

    let messages = $state([
        { id: 1, text: "안녕하세요! 무엇을 도와드릴까요?", sender: "ai" },
        { id: 2, text: "Svelte에 대해 알려줘.", sender: "user" },
        { id: 3, text: "Svelte는 사용자 인터페이스를 만들기 위한 반응형 JavaScript 프레임워크입니다.", sender: "ai" }
    ]);

    let newMessage = $state("");

    function sendMessage() {
        if (newMessage.trim() === "") return;
        messages.push({ id: Date.now(), text: newMessage, sender: "user" });
        newMessage = "";
        // TODO: AI 응답 로직 추가
    }
</script>

<div class="chat-container">
    <div class="messages">
        {#each messages as message (message.id)}
            <div class="message {message.sender}" transition:fade>
                {message.text}
            </div>
        {/each}
    </div>
    <div class="input-area">
        <input type="text" bind:value={newMessage} placeholder="메시지를 입력하세요..." onkeydown={(e) => e.key === 'Enter' && sendMessage()}>
        <button onclick={sendMessage}>전송</button>
    </div>
</div>

<style lang="scss">
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #f9f9f9;
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
        border-radius: 20px;
        max-width: 80%;
        word-wrap: break-word;

        &.user {
            background-color: #dcf8c6;
            align-self: flex-end;
        }

        &.ai {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            align-self: flex-start;
        }
    }

    .input-area {
        display: flex;
        padding: 10px;
        border-top: 1px solid #e0e0e0;
        background-color: #ffffff;

        input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 20px;
            margin-right: 10px;
        }

        button {
            padding: 10px 20px;
            border: none;
            background-color: #007bff;
            color: white;
            border-radius: 20px;
            cursor: pointer;

            &:hover {
                background-color: #0056b3;
            }
        }
    }
</style>
