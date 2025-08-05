<script lang="ts">
    import { fade } from "svelte/transition";
    import { page } from '$app/stores';

    // Chat state
    let messages = $state([
        { id: 1, text: "안녕하세요! smap에 대해 무엇이든 물어보세요.", sender: "ai" },
    ]);
    let newMessage = $state("");
    let isLoading = $state(false);

    // Retriever state
    let retrieverQuery = $state("");
    let isRetrieving = $state(false);
    let retrieverResults = $state<any[]>([]);
    let retrieverError = $state<string | null>(null);

    const mapName = $page.params.building_name;

    async function sendMessage() {
        if (newMessage.trim() === "" || isLoading) return;
        
        const userMessage = { id: Date.now(), text: newMessage, sender: "user" };
        messages.push(userMessage);
        
        const historyForAI = [...messages];
        
        newMessage = "";
        isLoading = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: historyForAI }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.statusText}`);
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

    async function runRetriever() {
        if (retrieverQuery.trim() === "" || isRetrieving) return;

        isRetrieving = true;
        retrieverError = null;
        retrieverResults = [];

        try {
            const response = await fetch('/api/retriever', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: retrieverQuery, mapName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch results');
            }

            const data = await response.json();
            retrieverResults = data.results;

        } catch (err: any) {
            console.error("Retriever error:", err);
            retrieverError = err.message;
        } finally {
            isRetrieving = false;
        }
    }
</script>

<div class="page-container">
    <div class="retriever-section">
        <h2>Retriever Test</h2>
        <div class="retriever-input-area">
            <input 
                type="text" 
                bind:value={retrieverQuery} 
                placeholder="Search for descriptions..."
                onkeydown={(e) => e.key === 'Enter' && runRetriever()}
                disabled={isRetrieving}
            >
            <button onclick={runRetriever} disabled={isRetrieving}>
                {#if isRetrieving}Searching...{:else}Search{/if}
            </button>
        </div>

        {#if retrieverError}
            <p class="error">Error: {retrieverError}</p>
        {/if}

        {#if retrieverResults.length > 0}
            <div class="results">
                <h3>Top 3 Results:</h3>
                <ul>
                    {#each retrieverResults as result (result.id)}
                        <li>
                            <strong>Text:</strong> {result.text || 'N/A'}<br>
                            <strong>Description:</strong> {result.description}<br>
                            <small>Similarity: {result.similarity.toFixed(4)}</small>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>

    <div class="chat-container">
        <div class="messages">
            {#each messages as message (message.id)}
                <div class="message {message.sender}" transition:fade>
                    {@html message.text.replace(/\n/g, '<br>')}
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
</div>

<style lang="scss">
    .page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }
    .retriever-section {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        background-color: #f5f5f5;

        h2 {
            margin-top: 0;
            margin-bottom: 15px;
        }

        .retriever-input-area {
            display: flex;
            margin-bottom: 15px;
        
            input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ccc;
                border-radius: 20px;
                margin-right: 10px;
            }

            button {
                padding: 10px 20px;
                border: none;
                background-color: #28a745;
                color: white;
                border-radius: 20px;
                cursor: pointer;
                &:disabled {
                    background-color: #aaa;
                }
            }
        }

        .error {
            color: #d9534f;
        }

        .results {
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                background: #fff;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
            }
        }
    }

    .chat-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
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
