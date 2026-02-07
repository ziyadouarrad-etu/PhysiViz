# 🔭⚛️ PhysiViz

**PhysiViz** is an AI-powered engineering tool designed to bridge the "abstraction gap" in physics education. By leveraging the **Gemini API** and **Three.js**, it "transpiles" natural language physics problems into **3D visualizations**, allowing students to gain immediate spatial intuition from static textbook descriptions.

---

## 🚀 Inspiration

As an engineering student at **ENSAM Casablanca**, I noticed that many peers struggle to translate 2D diagrams or word problems into accurate mental models. I built PhysiViz to act as a visual translator—turning complex mechanical constraints into a rotatable, inspectable 3D environment.

---

## ✨ Features

* **Natural Language to 3D**: Input physics problems via text or image to generate a high-fidelity scene.
* **Auto-Centering Engine**: Utilizes `@react-three/drei` to ensure all objects are perfectly centered in the camera's view, regardless of coordinate drift.
* **Interactive UI**: A modular interface featuring a chat panel for inputs and an info panel for physical metadata.
* **An AI Tutor**: An AI chatbot interface for discussion the physics problem creating a seamless user experience.

---

## 🛠️ Built With

### Frontend & 3D Rendering

* **React**: Modular UI component architecture.
* **TypeScript**: Strict type safety for complex physical data structures.
* **Three.js**: Core 3D engine for browser-based rendering.
* **@react-three/fiber & @react-three/drei**: React-native hooks and helpers for Three.js.

### Artificial Intelligence

* **Gemini API**: The "spatial architect" used for structured data extraction from natural language.
* **geminiService.ts**: Custom service layer for AI communication and data transpilation.

---

## 🏗️ Project Structure

```text
src/
├── components/
│   ├── ChatInterface.tsx  # Tutor Chatbot
│   ├── InfoPanel.tsx      # Physics metadata display
│   └── SceneViewer.tsx    # Three.js 3D rendering logic
├── services/
│   └── geminiService.ts   # Gemini API integration & parsing
├── types.ts               # Data contracts for physical objects
├── index.html
├── index.tsx
└── App.tsx                # Main application entry point

```

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
   
---

## 🧠 Challenges Overcome

The primary technical hurdle was **spatial layout management**. Because AI-generated coordinates can be mathematically correct but visually "lost" far from the origin, I implemented a centering logic using the `<Center top>` component.

Given a vector  defined as:

$$\vec{F} = F_x\hat{i} + F_y\hat{j} + F_z\hat{k}$$

The system automatically recalculates the bounding box to ensure the user is always looking at the heart of the problem, turning a potential UX breaking point into a seamless experience.

---

## 📈 What's Next

The roadmap for PhysiViz involves transitioning from **static visualization to dynamic simulation**. This includes:

* Integrating a physics engine (like **Rapier** or **Cannon.js**) for real-time motion.
* Utilizing the tool in workshops as an **AI & ML Trainer for GDG on Campus** at ENSAM Casablanca.

---

## 📸 Screenshot
<img width="1894" height="813" alt="image" src="https://github.com/user-attachments/assets/1cac4595-4e77-4876-a25a-f629556850f2" />

## 🎓 Author

**Ouarrad Ziyad** *First-year AI & CS Engineering Student at ENSAM Casablanca*

*AI & Machine Learning Trainer for GDG on Campus*

---
*Created as part of the Gemini 3 Hackathon project.*
