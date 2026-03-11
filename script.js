// Select elements
const promptForm = document.getElementById('prompt-form');
const promptTitle = document.getElementById('prompt-title');
const promptContent = document.getElementById('prompt-content');
const promptsContainer = document.getElementById('prompts');

// Load prompts from localStorage
function loadPrompts() {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    promptsContainer.innerHTML = '';
    prompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.innerHTML = `
            <h3>${prompt.title}</h3>
            <p>${prompt.content.substring(0, 50)}...</p>
            <button onclick="deletePrompt(${index})">Delete</button>
        `;
        promptsContainer.appendChild(card);
    });
}

// Save a new prompt
function savePrompt(event) {
    event.preventDefault();
    const title = promptTitle.value.trim();
    const content = promptContent.value.trim();

    if (title && content) {
        const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
        prompts.push({ title, content });
        localStorage.setItem('prompts', JSON.stringify(prompts));
        promptTitle.value = '';
        promptContent.value = '';
        loadPrompts();
    }
}

// Delete a prompt
function deletePrompt(index) {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    prompts.splice(index, 1);
    localStorage.setItem('prompts', JSON.stringify(prompts));
    loadPrompts();
}

// Event listeners
promptForm.addEventListener('submit', savePrompt);

// Initial load
loadPrompts();