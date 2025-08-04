<script lang="ts">
    import { fade } from "svelte/transition";

    let messages = $state([
        { id: 1, text: "안녕하세요! smap에 대해 무엇이든 물어보세요.", sender: "ai" },
    ]);

    let newMessage = $state("");
    let isLoading = $state(false);

    async function sendMessage() {
        if (newMessage.trim() === "" || isLoading) return;
        
        // 사용자 메시지 추가
        const userMessage = { id: Date.now(), text: newMessage, sender: "user" };
        messages.push(userMessage);
        
        const currentHistory = [...messages];
        newMessage = "";
        isLoading = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: currentHistory }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if(data.text) {
                messages.push({ id: Date.now() + 1, text: data.text, sender: "ai" });
            } else {
                throw new Error("Invalid response from AI");
            }

        } catch (error) {
            console.error("Failed to get AI response:", error);
            messages.push({ id: Date.now() + 1, text: "죄송합니다. 답변을 생성하는 데 문제가 발생했습니다.", sender: "ai" });
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="chat-container">
    <div class="messages">
        {#each messages as message (message.id)}
            <div class="message {message.sender}" transition:fade>
                <!-- AI 메시지인 경우, 줄바꿈을 <br> 태그로 렌더링 -->
                {#if message.sender === 'ai'}
                    {@html message.text.replace(/\n/g, '<br>')}
                {:else}
                    {message.text}
                {/if}
            </div>
        {/each}
        {#if isLoading}
            <div class="message ai typing" transition:fade>
                <span></span><span></span><span></span>
            </div>
        {/if}
    </div>
    <div class="input-area">
        <input 
            type="text" 
            bind:value={newMessage} 
            placeholder={isLoading ? "AI가 답변 중입니다..." : "메시지를 입력하세요..."}
            onkeydown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
        >
        <button onclick={sendMessage} disabled={isLoading}>전송</button>
    </div>
</div>

<style lang="scss">
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        background-color: #f9f9f9;
        border-left: 1px solid #e0e0e0;
        border-right: 1px solid #e0e0e0;
    }

    .messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .message {
        padding: 12px 18px;
        border-radius: 22px;
        max-width: 80%;
        word-wrap: break-word;
        line-height: 1.5;

        &.user {
            background-color: #007bff;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 6px;
        }

        &.ai {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            align-self: flex-start;
            border-bottom-left-radius: 6px;
        }
    }

    .message.typing {
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 5px;
        span {
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #999;
            border-radius: 50%;
            animation: typing 1s infinite ease-in-out;
        }
        span:nth-child(2) {
            animation-delay: 0.2s;
        }
        span:nth-child(3) {
            animation-delay: 0.4s;
        }
    }

    @keyframes typing {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-5px);
        }
    }


    .input-area {
        display: flex;
        padding: 10px;
        border-top: 1px solid #e0e0e0;
        background-color: #ffffff;

        input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #ccc;
            border-radius: 20px;
            margin-right: 10px;
            transition: border-color 0.2s;

            &:focus {
                outline: none;
                border-color: #007bff;
            }
            
            &:disabled {
                background-color: #f5f5f5;
            }
        }

        button {
            padding: 10px 20px;
            border: none;
            background-color: #007bff;
            color: white;
            border-radius: 20px;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover:not(:disabled) {
                background-color: #0056b3;
            }

            &:disabled {
                background-color: #aaa;
                cursor: not-allowed;
            }
        }
    }
</style>
