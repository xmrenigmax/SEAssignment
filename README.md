# Software Engineering Assignment  
### Historical AI Chatbot – Group Project (70%) | Exam (30%)

---

## Project Overview
Our group project is to **design and develop a web-based conversational AI chatbot**.  
The chatbot will simulate conversations with a **historical figure** of our choice, providing an engaging and educational interaction experience.

---

## Team Members & Roles

| Name   | Role             |
|--------|------------------|
| Riley    | **Group Leader** |
| Rohail | Engineer         |
| Daut   | Engineer         |
| Ryan | Engineer         |

---

## Deliverables
- **Peer Review Form** (individual submission)  
- **.zip File** containing:
  - React Frontend  
  - Express Backend  
- **Short Video Demo** (6 minutes, `.mp4`)  
- **Group Project Report** (max 12 pages, excluding references & appendices)  

---

## Marking Scheme
### 🔹 Code & Technical Implementation (20 marks)
- Professional **React + Express** codebase  
- Proper **component design**, **application structure**, and **JsDOC documentation**  
- Extensions beyond class content (e.g., LLM integration, advanced state handling, external APIs)  

### 🔹 Demo Interaction & Chatbot Behaviour (30 marks)
- Usability and accessibility of chatbot interface  
- Creative & engaging interaction design (aligned with chosen historical figure)  
- Clear demonstration of features in the **video demo**  

### 🔹 Report & Design Process (50 marks)
- Clear and appropriate **requirements**  
- Logical **architecture & design decisions** with rationale  
- Reflections on design & development challenges  
- Well-structured, complete **report** (following template)  

---

## Tech Stack
- **Frontend:** React (components, state management, UI/UX design)  
- **Backend:** Express.js (API, chatbot logic, server-side integration)  
- **Extensions:**  
  - integrate **LLM** or external APIs  
  - Advanced state handling for chatbot dialogue  

---

## Project Workflow
1. **Planning & Research** – Define requirements, select historical figure  
2. **Design Phase** – Architecture diagrams, component structure  
3. **Implementation** – Develop frontend + backend, integrate chatbot logic  
4. **Testing & Refinement** – Ensure usability, accessibility, and behaviour  
5. **Submission Package** – Code, report, peer review, and demo video  

---

✅ **SCRUM:** Use Teams (Scrum board) to track tasks & deadlines.  
✅ **Documentation:** Write clean commits & document code (JsDOC).  
✅ **Team Tip:** Meet biweekly to align progress and keep work consistent.  

---


## Project Setup

### 🔹 Client (Frontend)

#### Installed Packages
- **react** & **react-dom** → Core React library & DOM rendering  
- **vite** → Fast dev server & build tool  
- **@vitejs/plugin-react** → React + Vite integration  
- **eslint**, **eslint-plugin-react-hooks**, **eslint-plugin-react-refresh** → Code linting & standards  
- **prettier** (optional) → Code formatting  
- **@types/react**, **@types/react-dom** → Type definitions (future-proofing for TypeScript)  

#### How to Run
```bash
cd Client
npm install
npm run dev

``` 
frontend available on http://localhost:5173/ for now

#### Purpose of Frontend
- **Separation** → a clear separation of data, api and website development
- **UI** → responsive chatbot UI
- **integration** → integrates backend API for the chatbot to respond visually
- **interaction** → allows interaction of design (should be user friendly and accessible)


### 🔹 Server (Backend)

#### Installed Packages
- **Express** → Rest API framework
- **CORS** → enable connection between frontend and backend
- **nodemon** → auto reload server when updated

#### How to Run

```bash
cd Server
npm install
npm run dev

``` 

Backend runs on http://localhost:3000/ for now

#### Purpose of Backend
- **API** → provides API endpoints
- **Communication** → separates UI/UX with communication of API and JSON-based scripts
- **Manages middleware** → handles CORS
- **handles chatbot** → handles the chatbots communication flow and logic to separate from web UI/UX

### 🔹 Tests 

#### Purpose
- validates chatbot response logic
- ensures react components render correctly
- confirm backend API endpoint return expected results
- can be used to implement alternative methods for quality testing
