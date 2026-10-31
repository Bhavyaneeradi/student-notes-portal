
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");

// Upload notes
uploadForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(uploadForm);

    uploadMessage.textContent = "Uploading notes...";

    try {
        const response = await fetch("/api/notes", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            uploadMessage.textContent = result.message;
            uploadMessage.style.color = "green";

            uploadForm.reset();
            loadNotes();
        } else {
            uploadMessage.textContent = result.message;
            uploadMessage.style.color = "red";
        }
    } catch (error) {
        uploadMessage.textContent = "Upload failed. Please try again.";
        uploadMessage.style.color = "red";
    }
});

// Load and display notes
async function loadNotes(search = "") {
    notesContainer.textContent = "Loading notes...";

    try {
        const response = await fetch(
            "/api/notes?search=" + encodeURIComponent(search)
        );

        const notes = await response.json();

        notesContainer.innerHTML = "";

        if (notes.length === 0) {
            notesContainer.textContent = "No notes found.";
            return;
        }

        notes.forEach(function (note) {
            const card = document.createElement("div");
            card.className = "note-card";

            const title = document.createElement("h3");
            title.textContent = note.title;

            const subject = document.createElement("p");
            subject.textContent = "Subject: " + note.subject;

            const description = document.createElement("p");
            description.textContent = "Description: " + (note.description || "No description");

            const uploader = document.createElement("p");
            uploader.textContent = "Uploaded by: " + note.uploadedBy;

            const date = document.createElement("p");
            date.textContent = "Uploaded on: " +
                new Date(note.uploadedAt).toLocaleDateString();

            const download = document.createElement("a");
            download.href = "/api/notes/download/" + encodeURIComponent(note._id);
            download.textContent = "Download Notes";
            download.className = "download-btn";

            card.append(title, subject, description, uploader, date, download);
            notesContainer.appendChild(card);
        });
    } catch (error) {
        notesContainer.textContent = "Unable to load notes.";
    }
}

// Search notes
searchInput.addEventListener("input", function () {
    loadNotes(searchInput.value.trim());
});

// Load notes when page opens
loadNotes();
