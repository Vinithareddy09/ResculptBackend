# 🛠️ ReSculptBackend

An Express.js backend for the **ReSculpt** project — a personalized learning and growth platform for developers. This backend handles community interactions, gamification (badges, leaderboard), and progress tracking using a lightweight JSON-based database (`lowdb`).

🔗 **Project Repositories:**  
- Frontend: [ReSculptFrontend](https://github.com/Vinithareddy09/ResculptFrontend)  
- Backend: [ReSculptBackend](https://github.com/Vinithareddy09/ResculptBackend)
---

## 📁 Project Structure

ResculptBackend/
├── db.json <- Main database file (used by lowdb)
├── routes/
│ ├── badges.js <- Badge-related APIs
│ ├── leaderboard.js <- Leaderboard API
│ ├── contributions.js <- Community contribution routes
├── server.js <- Entry point for Express server
└── package.json <- Project metadata and dependencies


---

## 🚀 Features

- 🌟 **Gamification API** – Handle badges, levels, and achievements.
- 🏆 **Leaderboard API** – Dynamic leaderboard based on user activity.
- 🧑‍🤝‍🧑 **Community Support** – Submit and retrieve contributions.
- 📦 **Lightweight DB** – Uses `lowdb` (local JSON file) for quick prototyping.

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vinithareddy09/ResculptBackend.git
   cd ResculptBackend
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the server**
  ```bash
  node server.js
