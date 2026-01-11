# PhysiViz 🔬💡⚛️

**PhysiViz** is an AI-powered web application designed to bridge the gap between abstract physics equations and physical intuition. It transforms text-based physics problems into interactive, real-time 3D visualizations.

PhysiViz leverages Multimodal LLMs to analyze user prompts and dynamically generate complex physics scenes.

## ✨ Key Features

* **AI Text-Prompt Analysis**: A chat interface that interprets natural language physics problems.
* **3D Scene Generation**: Real-time rendering of physics situations for better spatial understanding.
* **Dynamic Physics Components**: Specialized support for simulating mechanical elements like **springs** and **pulleys**.
* **Interactive Chat Interface**: Allows users to refine understanding and explore different variables through a conversational UI.

## 🛠️ Tech Stack

* **Frontend**: React, TypeScript, Vite.
* **AI Integration**: Gemini API.
* **Rendering**: 3D visualization engine.
* **Language**: Over 97% TypeScript for robust, type-safe development.

## 📂 Project Structure

The project follows a modular React + TypeScript architecture to separate AI logic from 3D rendering and UI components.

```text
PhysiViz/
├── components/         # React UI components (Chat interface, 3D Canvas, Controls)
├── services/           # Core logic including Gemini API integration & physics solvers
├── types.ts            # TypeScript interfaces for physics objects (Springs, Pulleys, etc.)
├── App.tsx             # Main application entry point and state management
├── index.tsx           # Application root and DOM rendering
├── vite.config.ts      # Build and development configuration
├── metadata.json       # Project configuration for AI Studio
└── package.json        # Dependencies and scripts

```

## 🔑 Key Modules

* **`services/`**: This is the "brain" of the app. It handles the communication with the Gemini API to parse text prompts into structured physics data.
* **`components/`**: Handles the visualization layer, ensuring the 3D scenes are responsive and interactive.
* **`types.ts`**: Defines the mathematical and physical properties of simulation objects, ensuring type safety across the application.

## 🚀 Getting Started

### Prerequisites

* **Node.js** (Latest LTS recommended)
* A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/ziyadouarrad-etu/PhysiViz.git
cd PhysiViz

```


2. **Install dependencies**:
```bash
npm install

```


3. **Configure Environment**:
Create a `.env.local` file in the root directory and add your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here

```


4. **Run the app**:
```bash
npm run dev

```



The app will be available at `http://localhost:5173`.

## 🛠 Development Roadmap

* [ ] **User Accounts**: Implementation of secure login and cloud storage for physics scenes.
* [ ] **History Feature**: A dedicated section to revisit and re-run past visualizations.
* [ ] **Expanded Component Library**: Adding support for electromagnetism and fluid dynamics simulations.

## 🎯 Educational Impact

PhysiViz is designed for engineering students and educators. By visualizing static textbook problems in a 3D environment, it helps users understand the underlying dynamics of forces, tension, and motion that are often difficult to grasp through 2D diagrams alone.

---

*Created as part of the Gemini 3 Hackathon project.*
