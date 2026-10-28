# Bag of Holding

**Bag of Holding** is a Dungeons and Dragons character tracking application designed to simplify the player experience. It allows users to manage their characters, track spells, monitor consumables, and view detailed stats in a single, organized interface.  

This project was developed as the final project for the Full Stack Software Engineer certification at 4Geeks Academy.

---

##  Overview

Bag of Holding provides players with a complete toolkit for managing their adventures. Users can create and save multiple characters, browse an extensive spell list, and maintain key information such as skills, abilities, and consumables. The application focuses on providing an intuitive layout that helps players stay immersed in the game rather than distracted by paperwork.

---

##  Tech Stack

- **Frontend:** React, JavaScript, HTML, CSS  
- **Backend:** Python, Flask, SQLAlchemy  
- **Database:** PostgreSQL  
- **Version Control:** Git / GitHub  

---

##  Features

- Create and manage custom D&D characters  
- View and edit individual character details  
- Integrated login and sign-up system  
- Access a full spell list with descriptions  
- Track consumables such as potions and items  
- Record character stats and skill proficiencies  
- Built-in dice roller for quick in-game use  

---

##  Getting Started

Follow these steps to run the project locally.

**Requirements:** Python 3.13, [Pipenv](https://pipenv.pypa.io/), Node.js 20+. PostgreSQL is recommended (see below); without `DATABASE_URL` the backend falls back to SQLite.

### 1. Clone the repository
```bash
git clone https://github.com/RicardoLeidenz/Bag-Of-Holding.git
cd Bag-Of-Holding
```
### 2. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env`: choose a `DATABASE_URL` (or delete the line to use SQLite) and replace the placeholder secrets. During development the frontend forwards `/api` requests to the backend automatically.

### 3. Set up the backend
From the project root:
```bash
pipenv install --dev
pipenv run upgrade   # create the database tables
pipenv run start     # API on http://localhost:3001
```
### 4. Set up the frontend
In a second terminal, from the project root:
```bash
npm install
npm run dev          # app on http://localhost:3000
```

### Using PostgreSQL locally (recommended — production uses it)
On macOS with [Homebrew](https://brew.sh/):
```bash
brew install postgresql@17
brew services start postgresql@17      # runs in the background and at login
createdb bag_of_holding                # development database
createdb bag_of_holding_test           # separate database for tests
```
Then in `.env`: `DATABASE_URL=postgresql://<your-mac-username>@localhost:5432/bag_of_holding`, and run `pipenv run upgrade`.

### Running the tests
**Backend** (fast, uses an in-memory SQLite database by default):
```bash
pipenv run test
# against PostgreSQL instead (tables in the test database are wiped after each test):
TEST_DATABASE_URL=postgresql://<your-mac-username>@localhost:5432/bag_of_holding_test pipenv run test
```

**Browser end-to-end tests** (need Google Chrome installed). Start the API with rate limiting off so repeated runs aren't blocked, start the frontend, then run the suite:
```bash
RATELIMIT_ENABLED=false pipenv run start   # terminal 1
npm run dev                                # terminal 2
npm run test:e2e                           # terminal 3
```
The suite launches its own hidden Chrome with a temporary profile and creates its own test user.

### Usage
Once both servers are running, you can register a new account or log in as an existing user. From there, you can:
- Create new characters
- Manage inventory and consumables
- View available spells
- Track character stats and progress

### Future Improvements
Add support for party management and shared inventories
Implement dynamic dice rolling animations
Expand spell data with filtering and search options
Introduce dark mode and enhanced mobile support

### Credits
Developed by **Ricardo Leidenz** and **Lilith Lindsey** part of the **Full Stack Software Engineer Certification at 4Geeks Academy**.
Special thanks to instructors and peers for their guidance throughout the program.
