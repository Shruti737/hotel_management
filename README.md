# GlobInn Hotel API

A simple and maintainable Hotel Management API built with **NestJS, TypeScript, PostgreSQL, Sequelize, and class-validator**.

The API provides hotel creation, autocomplete search, hotel details, image URL handling, validation, database transactions, and PostgreSQL indexing.

---

## 🚀 Project Status

> **The project is LIVE and can be used here:**

**[Live API – Render](https://hotel-management-5o53.onrender.com)**

> Replace `https://hotel-management-5o53.onrender.com` with the actual Render deployment URL.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Programming language |
| PostgreSQL | Database |
| Sequelize | ORM | 
| class-validator | Request validation |
| Render | Deployment |
| Postman | API documentation |

---

# 1. Setup Instructions

## Prerequisites

Make sure the following are installed:

- **Node.js 20+**
- **npm**
- **PostgreSQL / Neon PostgreSQL**

## Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

## Install Dependencies

```bash
npm install
```

Create a `.env` file in the project root and configure the required environment variables.

---

# 2. Environment Variables

Create a `.env` file:

```env
PORT=3000

DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_SSL=true
```

> **Note:** Do not commit the `.env` file or database credentials to the repository.

---

# 3. Database Setup

The application uses **PostgreSQL with Sequelize**.

### Database Relationship

```
┌──────────────┐
│    hotels    │
└──────┬───────┘
       │
       │ 1 : N
       │
┌──────▼────────────┐
│   hotel_images    │
└───────────────────┘
```

### Run Migrations

```bash
npm run migration:run
```

### Seed Dummy Data

```bash
npm run seed
```

The seed contains sample hotels and image URLs for testing the APIs.

---

# 4. How to Run the Project

## Development

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

## Production

```bash
npm run build
npm run start:prod
```

The application is deployed on **Render** for production use.

---

# 5. API Documentation

API documentation is provided using **Postman**.

### Postman Collection

The Postman collection is stored inside the repository:

```
postman/
└── GlobInn-Hotel-API.postman_collection.json
```

The collection contains request examples, parameters, request bodies, responses, validation errors, and HTTP status codes.

## Available APIs

### Create Hotel

```http
POST /hotels
```

Creates a hotel with optional images.

### Hotel Autocomplete

```http
GET /hotels/autocomplete?q=gra
```

Returns up to **10 active hotels** matching the provided name prefix.

### Hotel Details

```http
GET /hotels/:id
```

Returns hotel details along with its images.

---

# 6. Architecture Explanation

The project follows a simple layered architecture with clear separation of responsibilities.

```
src/
├── modules/
│   └── hotels/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── dto/
│       ├── entities/
│       └── tests/
│
├── common/
├── config/
└── main.ts
```

### Responsibilities

| Layer | Responsibility |
|---|---|
| Controllers | Handle HTTP requests and responses |
| Services | Contain business logic |
| Repositories | Handle database queries |
| DTOs | Validate incoming request data |
| Entities | Define database models and relationships |
| Tests | Contain unit and integration tests |

This keeps controllers lightweight and avoids putting business logic directly inside controllers.

---

# 7. Database Design

The application uses two main tables.

## `hotels`

Stores the main hotel information.

| Column | Purpose |
|---|---|
| `id` | Unique hotel ID |
| `name` | Hotel name |
| `description` | Hotel description |
| `address` | Hotel address |
| `city` | Hotel city |
| `countryCode` | Country code |
| `latitude` | Hotel latitude |
| `longitude` | Hotel longitude |
| `starRating` | Hotel star rating |
| `isActive` | Active/inactive status |
| `normalizedName` | Normalized name used for autocomplete |

## `hotel_images`

Stores hotel image information.

| Column | Purpose |
|---|---|
| `id` | Unique image ID |
| `hotelId` | Related hotel ID |
| `url` | Image URL |
| `isPrimary` | Primary image indicator |
| `sortOrder` | Image display order |

### Relationship

```
Hotel
  │
  ├── Image 1
  ├── Image 2
  └── Image 3
```

### Why are images stored in a separate table?

A hotel can have multiple images, so images are stored in a separate `hotel_images` table using a **one-to-many relationship**.

This makes it easier to:

- Add or remove individual images
- Store image-specific data such as `isPrimary` and `sortOrder`
- Maintain image ordering
- Query images independently
- Keep the database structure normalized

Storing images as a JSON array inside the `hotels` table would make these operations and relationships harder to maintain.

---

# 8. Indexing Strategy

An index is created on the `normalizedName` column of the `hotels` table.

### Index

```
Index Name: idx_hotels_normalized_name
Column: normalizedName
```

The index supports the autocomplete prefix query:

```sql
normalizedName LIKE 'gra%'
```

Hotel names are normalized before storing and searching.

Therefore searches such as:

```
gra
Gra
GRA
```

work consistently.

### Additional Query Optimization

Autocomplete also:

- Returns a maximum of **10 results**
- Selects only `id`, `name`, and `city`
- Searches only active hotels
- Does not load hotel images

This reduces unnecessary database work and response size.

---

# 9. Autocomplete Scalability Approach

The current autocomplete implementation uses:

- Indexed `normalizedName`
- Prefix search
- Maximum 10 results
- Active hotel filtering
- Only required response fields
- No image loading

These choices keep the query and response small as the number of hotels grows.

For a future dataset of **5 million+ hotels**, the following approaches can be considered.

### Database Index

The `normalizedName` index allows PostgreSQL to efficiently perform prefix searches instead of unnecessarily scanning all hotel records.

### Prefix Search

The current implementation uses prefix matching:

```text
gra%
```

For example:

```
Grand Hotel
Grand Hyatt
Grace Hotel
```

can match the prefix `gra`.

### Query Optimization

Autocomplete is optimized by:

- Limiting results to 10
- Selecting only required fields
- Filtering only active hotels
- Not loading images

### Redis Caching

Frequently searched prefixes could be cached using Redis to reduce repeated database queries.

**Current status:** Not implemented.

### PostgreSQL Trigram Search

PostgreSQL `pg_trgm` could be considered if the requirement changes from prefix matching to substring or fuzzy matching.

**Current status:** Not implemented.

### Elasticsearch / OpenSearch

Elasticsearch or OpenSearch could be considered for very large-scale or advanced search requirements.

**Current status:** Not implemented because it is not required for the current assignment.

> **Current approach:** Indexed PostgreSQL prefix search is used for the current autocomplete requirement.

---

# 10. Assumptions and Trade-offs

## Image Handling

Actual image file uploading is not implemented. Images are represented using URLs.

Image URLs are validated using DTO validation.

The URL must:

- Be a valid URL
- Use `HTTP` or `HTTPS`
- Have a maximum length of 2048 characters

Example validation:

```typescript
@IsUrl(
  {
    require_protocol: true,
    protocols: ['http', 'https'],
  },
  {
    message: 'url must be a valid HTTP or HTTPS URL',
  },
)
@MaxLength(2048)
url: string;
```

### Invalid Image Data

If an invalid image URL is provided:

```text
400 Bad Request
```

is returned.

The complete hotel creation request is rejected.

The application validates the **URL format only**. It does not make an external request to verify whether the URL actually points to an existing image.

---

## Transaction Strategy

Creating a hotel and its images is handled as a **single database transaction**.

### Successful Flow

```
Create Hotel
     ↓
Create Images
     ↓
  Commit
```

### Failure Flow

```
Create Hotel
     ↓
Create Images
     ↓
   Failed
     ↓
  Rollback
```

This ensures that hotel and image creation remain atomic and prevents partially created data.

---

## Other Assumptions

- Autocomplete requires a minimum of **2 characters**.
- Autocomplete returns a maximum of **10 results**.
- Only active hotels are returned in autocomplete.
- Images are not returned in autocomplete.
- Hotel details return images in `sortOrder`.
- Images are stored as URLs instead of uploaded files.
- Redis is not required for the current implementation.
- PostgreSQL trigram search is not required for the current implementation.
- Elasticsearch/OpenSearch is not required for the current implementation.
- PostgreSQL indexed prefix search is used for the current autocomplete requirement.

---

## 📁 Project Structure

```
src/
├── modules/
│   └── hotels/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── dto/
│       ├── entities/
│       └── tests/
│
├── common/
├── config/
└── main.ts

database/
├── migrations/
└── seeders/

postman/
└── GlobInn-Hotel-API.postman_collection.json
```