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

// Step 1: Analyze data to export
// Export all prompts with their metadata

// Step 2: Design export JSON schema
const EXPORT_SCHEMA_VERSION = "1.0";

// Step 3: Create export function
function exportPrompts() {
  try {
    const prompts = JSON.parse(localStorage.getItem("prompts")) || [];

    // Validate data integrity
    if (!Array.isArray(prompts)) {
      throw new Error("Invalid data format in localStorage.");
    }

    // Calculate statistics
    const totalPrompts = prompts.length;
    const averageRating =
      totalPrompts > 0
        ? prompts.reduce((sum, p) => sum + (p.rating || 0), 0) / totalPrompts
        : 0;
    const mostUsedModel = prompts.reduce((acc, p) => {
      acc[p.model] = (acc[p.model] || 0) + 1;
      return acc;
    }, {});

    const mostUsedModelName = Object.keys(mostUsedModel).reduce((a, b) =>
      mostUsedModel[a] > mostUsedModel[b] ? a : b
    );

    // Create export object
    const exportData = {
      version: EXPORT_SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      statistics: {
        totalPrompts,
        averageRating,
        mostUsedModel: mostUsedModelName,
      },
      prompts,
    };

    // Create blob and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts_export_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error.message);
  }
}

// Step 4: Create import function
function importPrompts(file, merge = false) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);

      // Validate JSON structure and version
      if (
        !importedData.version ||
        importedData.version !== EXPORT_SCHEMA_VERSION
      ) {
        throw new Error("Unsupported export version.");
      }

      if (!Array.isArray(importedData.prompts)) {
        throw new Error("Invalid prompts data in the imported file.");
      }

      // Backup existing data
      const existingPrompts = JSON.parse(localStorage.getItem("prompts")) || [];
      localStorage.setItem("prompts_backup", JSON.stringify(existingPrompts));

      // Check for duplicate IDs
      const existingIds = new Set(existingPrompts.map((p) => p.id));
      const duplicates = importedData.prompts.filter((p) =>
        existingIds.has(p.id)
      );

      if (duplicates.length > 0 && !merge) {
        throw new Error(
          `Duplicate IDs found: ${duplicates.map((d) => d.id).join(", ")}`
        );
      }

      // Merge or replace data
      const newPrompts = merge
        ? [
            ...existingPrompts,
            ...importedData.prompts.filter((p) => !existingIds.has(p.id)),
          ]
        : importedData.prompts;

      localStorage.setItem("prompts", JSON.stringify(newPrompts));
      loadPrompts();
    } catch (error) {
      console.error("Import failed:", error.message);

      // Rollback on failure
      const backup = localStorage.getItem("prompts_backup");
      if (backup) {
        localStorage.setItem("prompts", backup);
      }
    }
  };
  reader.readAsText(file);
}

// Step 5: Add buttons for import/export
function setupImportExportButtons() {
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export Prompts";
  exportButton.onclick = exportPrompts;

  const importButton = document.createElement("input");
  importButton.type = "file";
  importButton.accept = ".json";
  importButton.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const merge = confirm(
        "Merge with existing prompts? Click Cancel to replace."
      );
      importPrompts(file, merge);
    }
  };

  const container = document.querySelector(".container");
  container.appendChild(exportButton);
  container.appendChild(importButton);
}

// Event listeners
promptForm.addEventListener("submit", savePrompt);

// Initial load
loadPrompts();

// Initialize import/export buttons
setupImportExportButtons();
