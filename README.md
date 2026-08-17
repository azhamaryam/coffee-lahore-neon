# Coffee Hub Lahore ☕

A website for exploring and rating coffee cafes in Lahore. Users can browse cafes, check rankings, rate cafes, leave reviews, and keep track of the cafes they've tried.

<!-- Tech stack used in the project -->

## Tech Stack

* HTML
* CSS
* JavaScript
* Node.js
* Express.js
* PostgreSQL
* Neon
* Vercel

<!-- Main features -->

## Features

* Browse cafes in Lahore
* View Top 10 cafes
* Rank cafes by overall rating or individual categories
* View Top 10 drinks of the month
* Search and filter cafes
* View cafe details and available drinks/flavours
* Rate cafes in four categories:

  * Ambiance
  * Service
  * Food
  * Drinks & Taste
* Leave reviews and comments
* View separate Creator and Community reviews
* Mark cafes as "tried"
* Private user dashboard
* Admin panel for managing cafes and drinks
* Admin can assign users as Creators
* Browse the website without an account
* Account required for ratings and reviews

<!-- Database setup -->

## Database Setup

The project uses PostgreSQL with Neon.

1. Create a project on [Neon](https://neon.tech).
2. Open the **Connect** section and copy the database connection string.
3. Create a `.env` file in the project folder.
4. Add the following:

```env
DATABASE_URL=your-neon-connection-string
JWT_SECRET=your-secret-key
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-admin-password
```

<!-- Local setup -->

## Running Locally

Make sure **Node.js 20 or newer** is installed.

Check the installation:

```bash
node -v
npm -v
```

Install the project dependencies:

```bash
npm install
```

Set up the database:

```bash
npm run migrate
```

Add the initial/sample data:

```bash
npm run seed
```

Start the website:

```bash
npm start
```

Open the website in your browser at:

```text
http://localhost:3000
```

<!-- Admin login -->

After starting the project, log in using the admin email and password from your `.env` file.

The admin panel can be used to:

* Add and remove cafes
* Add and remove drinks
* View users
* Assign users as Creators

<!-- Deployment -->

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add these environment variables in the Vercel project settings:

| Variable         | Value                                |
| ---------------- | ------------------------------------ |
| `DATABASE_URL`   | Your Neon database connection string |
| `JWT_SECRET`     | Your secret key                      |
| `ADMIN_EMAIL`    | Admin email                          |
| `ADMIN_PASSWORD` | Admin password                       |

4. Deploy the project.

Once the deployment is complete, Vercel will provide a URL for the live website.

Make sure the database has been migrated and seeded before using the live version.

<!-- Project structure -->

## Project Structure

```text
coffee-lahore/
│
├── api/
├── middleware/
├── routes/
├── utils/
├── public/
│   ├── css/
│   ├── js/
│   └── html files
│
├── app.js
├── db.js
├── package.json
└── README.md
```

<!-- Design information -->

## Design

The website uses a warm coffee-inspired color palette:

* Butter Yellow: `#F6E4A8`
* Cocoa Brown: `#4A2E22`
* Gold: `#C68A2E`

Fraunces is used for headings and Inter for regular text.

<!-- Additional notes -->

## Notes

* Cafe images are added using image URLs.
* Anyone can browse cafes and reviews without an account.
* Users need an account to rate cafes or leave reviews.
* Each user's tried-cafe list is private.
* Only admin accounts can access the admin features.

☕ Coffee Hub Lahore — find your next coffee spot.
