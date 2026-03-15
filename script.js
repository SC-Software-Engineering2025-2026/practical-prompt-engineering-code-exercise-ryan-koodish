// Select elements
const promptForm = document.getElementById("prompt-form");
const promptTitle = document.getElementById("prompt-title");
const promptContent = document.getElementById("prompt-content");
const promptsContainer = document.getElementById("prompts");

// Function to render stars
function renderStars(rating, promptId) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${
      i <= rating ? "filled" : ""
    }" onclick="setRating('${promptId}', ${i})">&#9733;</span>`;
  }
  return `<div class="rating">${stars}</div>`;
}

// Function to set rating
function setRating(promptId, rating) {
  const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
  const prompt = prompts.find((p) => p.id === promptId);
  if (prompt) {
    prompt.rating = rating;
    localStorage.setItem("prompts", JSON.stringify(prompts));
    loadPrompts();
  }
}

// Add notes functionality
function addNote(promptId) {
  const noteContent = prompt("Enter your note:");
  if (noteContent) {
    const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      prompt.notes = prompt.notes || [];
      prompt.notes.push({ id: `note-${Date.now()}`, content: noteContent });
      localStorage.setItem("prompts", JSON.stringify(prompts));
      loadPrompts();
    }
  }
}

function deleteNote(promptId, noteId) {
  const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
  const prompt = prompts.find((p) => p.id === promptId);
  if (prompt) {
    prompt.notes = prompt.notes.filter((note) => note.id !== noteId);
    localStorage.setItem("prompts", JSON.stringify(prompts));
    loadPrompts();
  }
}

function renderNotes(notes, promptId) {
  return notes
    .map(
      (note) => `
        <div class="note">
          <p>${note.content}</p>
          <button onclick="deleteNote('${promptId}', '${note.id}')">Delete Note</button>
        </div>
      `
    )
    .join("");
}

// Metadata tracking system
function trackModel(modelName, content) {
  if (!modelName || typeof modelName !== "string" || modelName.length > 100) {
    throw new Error(
      "Invalid model name. Must be a non-empty string with a maximum of 100 characters."
    );
  }

  const createdAt = new Date().toISOString();
  const tokenEstimate = estimateTokens(content, false);

  return {
    model: modelName,
    createdAt,
    updatedAt: createdAt,
    tokenEstimate,
  };
}

function updateTimestamps(metadata) {
  const updatedAt = new Date().toISOString();
  if (new Date(updatedAt) < new Date(metadata.createdAt)) {
    throw new Error(
      "Updated timestamp cannot be earlier than created timestamp."
    );
  }
  metadata.updatedAt = updatedAt;
  return metadata;
}

function estimateTokens(text, isCode) {
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;
  let min = 0.75 * wordCount;
  let max = 0.25 * charCount;

  if (isCode) {
    min *= 1.3;
    max *= 1.3;
  }

  const confidence = max < 1000 ? "high" : max <= 5000 ? "medium" : "low";

  return { min: Math.round(min), max: Math.round(max), confidence };
}

// Example usage
function addMetadataToPrompt(prompt) {
  try {
    const metadata = trackModel(prompt.model, prompt.content);
    prompt.metadata = metadata;
    return prompt;
  } catch (error) {
    console.error("Error tracking metadata:", error.message);
  }
}

// Load prompts from localStorage
function loadPrompts() {
  const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
  promptsContainer.innerHTML = "";
  prompts.forEach((prompt, index) => {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.innerHTML = `
            <h3>${prompt.title}</h3>
            <p>${prompt.content.substring(0, 50)}...</p>
            ${renderStars(prompt.rating || 0, prompt.id)}
            <button onclick="addNote('${prompt.id}')">Add Note</button>
            <div class="notes">${renderNotes(
              prompt.notes || [],
              prompt.id
            )}</div>
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
    const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    prompts.push({ title, content });
    localStorage.setItem("prompts", JSON.stringify(prompts));
    promptTitle.value = "";
    promptContent.value = "";
    loadPrompts();
  }
}

// Delete a prompt
function deletePrompt(index) {
  const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
  prompts.splice(index, 1);
  localStorage.setItem("prompts", JSON.stringify(prompts));
  loadPrompts();
}

// Event listeners
promptForm.addEventListener("submit", savePrompt);

// Initial load
loadPrompts();
