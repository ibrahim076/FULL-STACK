# Contact Desk

A contact directory for the UNIT 3 Node.js, Express.js, MongoDB and Mongoose assignment. It includes the five required CRUD endpoints, a responsive browser interface, search, sorting, pagination, structured validation errors and repeatable API tests.

## Run locally

Install Node.js 22 or newer and use either a local MongoDB server or MongoDB Atlas.

```sh
git clone https://github.com/ibrahim076/24CSI013---FULL-STACK.git
cd 24CSI013---FULL-STACK
npm ci
```

Copy `.env.example` to `.env`. On Windows PowerShell use `Copy-Item .env.example .env`; on macOS/Linux use `cp .env.example .env`.

Set `MONGODB_URI` to your MongoDB connection string. The default example is:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/contact_management
PORT=3000
```

Start your local MongoDB service, or configure an Atlas database user and network access before using its URI. The application explicitly selects **contact_management** and waits for the unique indexes before listening.

```sh
npm run dev
```

Open **http://localhost:3000** for the browser interface. Use `npm start` to run without automatic restarts. Secrets stay in `.env`, which Git ignores.

## Browser workflow

Use the left-hand form to create a contact. The directory offers Edit and Delete actions; deletion asks for confirmation. Search matches names, phone numbers, email addresses and contact IDs. Sort alphabetically or by newest first, and move through eight contacts per page. Requests use text-safe rendering for contact values. An empty email is omitted; when editing, a blank email leaves the existing address unchanged.

## Data contract

| Field | Validation |
| --- | --- |
| `contactId` | Unique string, generated with a `CNT-` UUID prefix if omitted. Custom IDs accept 1–100 letters, digits, underscores and hyphens. Immutable after creation. |
| `name` | Required string, trimmed, 1–120 characters. |
| `phone` | Required string with exactly 10 digits. Leading zeroes are preserved. |
| `email` | Optional string; when supplied must have valid email format, at most 254 characters. Trimmed, lowercased and unique. |

Only name and phone are explicitly required by the assignment, so multiple contacts may omit email. A partial unique index enforces email uniqueness for supplied values. `createdAt` and `updatedAt` are included in responses; the internal MongoDB `_id` is hidden. Numeric phone values, nulls, blank values and unknown fields are rejected.

## API reference

Send JSON with `Content-Type: application/json`. Every `:id` below is **contactId**, not MongoDB `_id`.

| Method | Path | Success response |
| --- | --- | --- |
| POST | `/contacts` | 201 with `{ "data": contact }` and a Location header |
| GET | `/contacts` | 200 with `{ "data": [...], "pagination": {...} }` |
| GET | `/contacts/:id` | 200 with `{ "data": contact }` |
| PUT | `/contacts/:id` | 200 with the updated contact; unspecified fields stay unchanged |
| DELETE | `/contacts/:id` | 200 with a confirmation and the deleted contactId |
| GET | `/health` | 200 when MongoDB is connected, otherwise 503 |

### Create a contact

`POST /contacts`

```json
{
  "contactId": "desk-001",
  "name": "Noor Ahmed",
  "phone": "0123456789",
  "email": "noor@example.com"
}
```

Example response (timestamps vary):

```json
{
  "data": {
    "contactId": "desk-001",
    "name": "Noor Ahmed",
    "phone": "0123456789",
    "email": "noor@example.com",
    "createdAt": "2026-09-29T06:00:00.000Z",
    "updatedAt": "2026-09-29T06:00:00.000Z"
  }
}
```

### Retrieve and search

`GET /contacts/desk-001` returns the same `data` object. `GET /contacts` returns paginated results (default 20 per page). All contacts are accessible by following the pages.

```text
GET /contacts?q=Noor&page=1&limit=10&sort=name
```

The response contains `data` and `pagination` with `page`, `limit`, `total` and `pages`. An empty directory returns `data: []`, `total: 0` and `pages: 0`. The maximum page size is 100; page must be a positive integer up to 1,000,000. Search is a case-insensitive literal match of up to 100 characters. Allowed sort values are `name`, `-name` and `-createdAt`. Invalid query values return 400.

### Update

`PUT /contacts/desk-001`

```json
{ "name": "Noor Ali", "phone": "9876543210" }
```

The response contains the complete updated `data` object. Email remains unchanged if omitted. Validation runs on updates, including uniqueness checks; contactId cannot be renamed.

### Delete

`DELETE /contacts/desk-001` returns:

```json
{ "message": "Contact removed", "contactId": "desk-001" }
```

### Errors

Errors use a consistent envelope. For an invalid phone:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the contact details",
    "fields": { "phone": "Phone must be exactly 10 digits" }
  }
}
```

| Status | Typical code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_ERROR / INVALID_BODY / INVALID_JSON / INVALID_QUERY / IMMUTABLE_ID | Correct the input |
| 404 | NOT_FOUND | Contact or endpoint does not exist |
| 409 | DUPLICATE_CONTACT | Email or contactId already exists |
| 413 | BODY_TOO_LARGE | JSON exceeds 16 KB |
| 500 | INTERNAL_ERROR | Unexpected server failure; internal details are hidden |

## Postman and automated testing

Import **postman/contact-desk.json** into Postman. Start the app, set the collection's `baseUrl` to `http://localhost:3000`, and run the collection in order. It creates its own uniquely named record, checks CRUD and validation, and deletes that record.

```sh
npm test
npm run test:postman
```

The first command tests persistence, generated IDs, email uniqueness, create/update validation, literal search, pagination, ordering, missing records, malformed requests, static assets and health. The second runs the Postman collection using Newman. Both use a temporary **real MongoDB process** and do not touch the database in `.env`. First use downloads a MongoDB executable and requires internet access. If one is already installed, set `MONGOMS_SYSTEM_BINARY` to its absolute executable path to avoid the download.

GitHub Actions runs both commands on pushes and pull requests. Newman is a development-only test tool; it is not loaded by the application server.

## Organization

```text
app.js                   Express configuration and middleware
server.js                Configuration, database startup and shutdown
lib/contact.js           Mongoose schema and indexes
lib/contact-routes.js    CRUD, filtering and pagination
lib/errors.js            Consistent API error responses
public/                  Browser interface
test/                    Integration tests
postman/                 Importable API checks
scripts/                 Isolated Postman runner
```

This assignment demonstrates a single shared contact directory. Authentication and multi-user isolation are outside its scope. Use fictional contacts for demonstrations; this repository is source code, not a hosted production service.
