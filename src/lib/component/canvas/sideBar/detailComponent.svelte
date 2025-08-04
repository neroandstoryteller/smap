<script lang="ts">
    import {
        stage,
        layer,
        shapes,
        selectedShape,
        konvaModule,
        transformer,
        isReady,
        editable,
        isDrawingLine,
        genId,
        fillColor,
        addGroup,
        save,
        refreshCanvas,
        saveHistory,
        getShapeData,
    } from "$lib/store/canvasStore";
    import { uploadImage, deleteImage } from "$lib/database/firestore";
    import { Group } from "konva/lib/Group";

    let selectedShapeName: string = $state('');
    let descriptionInput: string = $state('');
    let images: string[] = $state([]);
    let fileInput: HTMLInputElement | null = $state(null);
    let draggedIndex: number | null = null;

    $effect(() => {
        if ($selectedShape) {
            descriptionInput = $selectedShape.getAttr('description') || '';
            images = $selectedShape.getAttr('images') || [];
            const shapeName = getShapeName($selectedShape)
            selectedShapeName = shapeName || "";
        } else {
            descriptionInput = '';
            selectedShapeName = "";
            images = [];
        }
    });

    async function handleImageUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0] && $selectedShape) {
            const file = input.files[0];
            const imageUrl = await uploadImage(file);
            
            const currentImages = $selectedShape.getAttr('images') || [];
            $selectedShape.setAttr('images', [...currentImages, imageUrl]);
            images = [...images, imageUrl];

            refreshCanvas();
        }
    }

    async function handleDeleteImage(index: number) {
        if ($selectedShape && images[index]) {
            const imageUrl = images[index];
            try {
                // await deleteImage(imageUrl);
                images = images.filter((_, i) => i !== index);
                $selectedShape.setAttr('images', images);
                refreshCanvas();
            } catch (error) {
                console.error('Failed to delete image:', error);
            }
        }
    }

    function handleDragStart(index: number) {
        return (e: DragEvent) => {
            draggedIndex = index;
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
        };
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    function handleDrop(index: number) {
        return (e: DragEvent) => {
            e.preventDefault();
            if (draggedIndex === null || draggedIndex === index) return;
            const newImages = [...images];
            const [movedImage] = newImages.splice(draggedIndex, 1);
            newImages.splice(index, 0, movedImage);
            images = newImages;
            $selectedShape?.setAttr('images', newImages);
            refreshCanvas();
            draggedIndex = null;
        };
    }

    function preventDefault(e: DragEvent) {
        e.preventDefault();
    }

    function handleDescriptionChange() {
        if ($selectedShape) {
            $selectedShape.setAttr('description', descriptionInput);
            refreshCanvas();
        }
    }

    function getShapeName(shape: Group) {
        const shapeData = getShapeData(shape);
        if (!shapeData) return;
        return shapeData.text;
    }

    function triggerFileInput() {
        if (fileInput) {
            fileInput.click();
        }
    }
</script>

<div class="shape-info" class:disabled={!$selectedShape}>
    <div class="shape-name">{selectedShapeName}</div>

    {#if $editable}
        <!-- Description Input -->
        <div class="shape-property">
            <label for="description" class="label">설명</label>
            <textarea
                id="description"
                bind:value={descriptionInput}
                oninput={handleDescriptionChange}
                disabled={!$selectedShape}
                class="textarea"
                rows="4"
                placeholder="설명을 적어주세요."
            ></textarea>
        </div>
    {:else}
        <div class="shape-property">
            <label for="description" class="label">설명</label>
            <div class="description">{descriptionInput}</div>
        </div>
    {/if}
    
    <!-- Image Upload -->
    {#if $editable}
        <div class="shape-property">
            <label for="description" class="label">사진</label>
            <button onclick={triggerFileInput}>
                파일 업로드
            </button>
            <input
                type="file"
                id="image-upload"
                accept="image/*"
                bind:this={fileInput}
                onchange={handleImageUpload}
                disabled={!$selectedShape}
                class="file-input"
            />
        </div>
    {/if}

    <!-- Image Gallery -->
     
    {#if $selectedShape && images.length > 0}
        <div class="shape-property">
            <div class="image-flex">
                {#each images as image, index}
                    {#if $editable}
                        <div 
                            class="image-container" 
                            role="listitem"
                            draggable="true"
                            aria-grabbed="false"
                            ondragstart={handleDragStart(index)}
                            ondragover={handleDragOver}
                            ondrop={handleDrop(index)}
                            ondragenter={preventDefault}
                            ondragleave={preventDefault}
                        >
                            <img src={image} alt="Group" class="gallery-image" />
                            <button class="delete-btn" onclick={() => handleDeleteImage(index)}>
                                ×
                            </button>
                        </div>
                        {:else}
                            <div 
                                class="image-container" 
                                role="listitem"
                                draggable="true"
                                aria-grabbed="false"
                            >
                                <img src={image} alt="Group" class="gallery-image" />
                            </div>
                        {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$lib/style/main.scss" as *;

    .shape-name {
        @include typography-title;
    }

    .shape-info {
        display: flex;
        flex-direction: column;
        padding: 10px;
        height: 100%;
        overflow-y: auto;
        transition: $transition;
        gap: 20px;

        &.disabled {
            opacity: 0.6;
            pointer-events: none;
        }

        .shape-property {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .label {
                @include typography-body-bold;
            }
            
            .description{
                @include typography-small;
            }

            .textarea {
                width: calc(100% - 10px);
                resize: none;                
                padding: 4px;
                border: 1px solid $colorMedium;
                border-radius: 4px;
                @include typography-small;
                transition: $transition border-color;
                height: 150px;

                &:hover:not(:disabled) {
                    border-color: $colorSymbolGreen;
                }

                &:focus {
                    outline: none;
                    border-color: $colorSymbolGreen;
                    box-shadow: 0 0 6px rgba($colorSymbolGreen, 0.2);
                }

                &:disabled {
                    background: $colorMedium;
                    color: $color-text-tertiary;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
            }

            .file-input {
                display: none;
            }

            .image-flex {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                height: 100%;
            }

            .image-container {
                position: relative;
                display: inline-block;
                cursor: move; /* Indicate draggable */
            }

            .gallery-image {
                width: 260px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid $colorMediumDark;
            }

            .delete-btn {
                display: none;
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 16px;
                line-height: 24px;
                text-align: center;
                cursor: pointer;
                padding: 0;
                transition: $transition;
            }

            .image-container:hover .delete-btn {
                display: block;
            }

            .delete-btn:hover {
                background: rgba(255, 0, 0, 0.7);
            }
        }
    }

    button {
        @include typography-small;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 8px;
        padding: 10px;
        background: $colorBright;
        color: $color-text-primary;
        cursor: pointer;
        transition: $transition;
        position: relative;
        &:disabled {
            background: $colorMedium;
            color: $colorWhite;
            cursor: not-allowed;
            opacity: 0.6;
        }
        &:hover:not(:disabled) {
            background: $colorSymbolGreen;
            color: $color-text-inverse;
        }
    }
</style>