const myLibrary = [];

function Book(title, author, pages, read) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
}

// toggle read status
Book.prototype.toggleRead = function() {
    this.read = !this.read;
};

function addBookToLibrary(title, author, pages, read) {
    const newBook = new Book(title, author, pages, read);
    myLibrary.push(newBook);
}

function displayBooks() {
    const display = document.getElementById("libraryDisplay");
    const emptyMsg = document.getElementById("emptyMsg");

    // clear old cards (but not the empty message)
    const oldCards = display.querySelectorAll(".book-card");
    oldCards.forEach(card => card.remove());

    if (myLibrary.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    myLibrary.forEach(function(book) {
        const card = document.createElement("div");
        card.classList.add("book-card");
        card.setAttribute("data-id", book.id);

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.textContent = "by " + book.author;

        const pages = document.createElement("p");
        pages.textContent = book.pages + " pages";

        const readBadge = document.createElement("span");
        readBadge.classList.add("read-badge");
        if (book.read) {
            readBadge.textContent = "Read";
            readBadge.classList.add("read");
        } else {
            readBadge.textContent = "Not Read";
            readBadge.classList.add("not-read");
        }

        const cardButtons = document.createElement("div");
        cardButtons.classList.add("card-buttons");

        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("toggle-btn");
        toggleBtn.textContent = "Toggle Read";
        toggleBtn.addEventListener("click", function() {
            book.toggleRead();
            displayBooks();
        });

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-btn");
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", function() {
            removeBook(book.id);
        });

        cardButtons.appendChild(toggleBtn);
        cardButtons.appendChild(removeBtn);

        card.appendChild(title);
        card.appendChild(author);
        card.appendChild(pages);
        card.appendChild(readBadge);
        card.appendChild(cardButtons);

        display.appendChild(card);
    });
}

function removeBook(id) {
    // find the index of the book and remove it
    const index = myLibrary.findIndex(function(book) {
        return book.id === id;
    });
    if (index !== -1) {
        myLibrary.splice(index, 1);
    }
    displayBooks();
}

// some starter books so the page isn't empty at first
addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 310, true);
addBookToLibrary("Harry Potter", "J.K. Rowling", 223, false);
addBookToLibrary("Clean Code", "Robert C. Martin", 431, false);

displayBooks();

// dialog stuff
const dialog = document.getElementById("bookDialog");
const newBookBtn = document.getElementById("newBookBtn");
const cancelBtn = document.getElementById("cancelBtn");
const bookForm = document.getElementById("bookForm");

newBookBtn.addEventListener("click", function() {
    dialog.showModal();
});

cancelBtn.addEventListener("click", function() {
    dialog.close();
    bookForm.reset();
});

bookForm.addEventListener("submit", function(event) {
    event.preventDefault(); // stop form from reloading page

    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const pages = parseInt(document.getElementById("pages").value);
    const read = document.getElementById("readStatus").checked;

    addBookToLibrary(title, author, pages, read);
    displayBooks();

    dialog.close();
    bookForm.reset();
});
