import express, { response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Function to fetch book data
async function fetchBookData(query) {
    try {
        const { data } = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: query,  // This can be a title, author, or ID
                maxResults: 10
            }
        });

        return data.items.map(book => ({
            id: book.id,
            title: book.volumeInfo.title,
            author: book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : 'Unknown Author',
            coverImage: book.volumeInfo.imageLinks 
                ? book.volumeInfo.imageLinks.thumbnail 
                : 'https://placehold.co/200x250?text=No+Cover',
            publishYear: book.volumeInfo.publishedDate || 'Unknown',
            summary: book.volumeInfo.description || 'No summary available',
            category: book.volumeInfo.categories ? book.volumeInfo.categories.join(", ") : 'Unknown'
        }));
    } catch (error) {
        console.error("Error fetching book data:", error);
        return [];
    }
}

// Endpoint for search requests
app.get('/search', async (req, res) => {
    const title = req.query.title;
    if (title && title.length >= 3) {
        const results = await fetchBookData(title);
        res.json(results);
    } else {
        res.json([]);
    }
});


app.get('/add/:id', async (req, res) => {
    const id = req.params.id;
    // Fetch your book data based on the ID
    const results = await fetchBookData(id);
    const details = await db.query("SELECT * FROM books WHERE book_id = ($1)", [id]);
    const book = details.rows[0] || '';
    const bookNote = await db.query("SELECT * FROM notes WHERE book_id = ($1)", [book.id]);
    const note = bookNote.rows[0] || '';
    res.render("book", {book: results[0], details: book, note: note});
});

app.post('/save', async (req, res) => {
    const id = req.body.id;
    const rating = req.body.rating;
    const note = req.body.note;
    const result = await fetchBookData(id);

    // Ensure publishYear is extracted correctly if it's a date string
    const publishYear = result[0].publishYear.split('-')[0];  // Extract the year part (e.g., '2014' from '2014-02-18')

    try {
        // Insert into the books table, with the corrected publishYear
        const response = await db.query(
            "INSERT INTO books (book_id, title, author, publish_year, category, description, rating, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;",
            [id, result[0].title, result[0].author, publishYear, result[0].category, result[0].summary, rating, result[0].coverImage]
        );

        try {
            // Insert note associated with the book
            await db.query("INSERT INTO notes (note, book_id) VALUES ($1, $2);", [note, response.rows[0].id]);
            res.redirect("/");
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});

app.get("/", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM books ORDER BY id ASC");
        const books = results.rows;
        res.render("index", {books: books});
      } catch (err) {
        console.log(err);
      }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
