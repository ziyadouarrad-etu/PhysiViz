import { GoogleGenAI } from "@google/genai";
import { PhysicsScene } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a "Physics Scene Compiler." Your task is to analyze images of physics problems and extract the state into a structured JSON format for a 3D simulation engine (Three.js).

### Extraction Rules:
1. Identify all rigid bodies (spheres, cubes, planes, cones, cylinders, wedges/ramps).
2. **Inclined Planes/Ramps**: 
   - Use the 'wedge' shape for ramps. A wedge is a triangular prism.
   - For 'wedge', dimensions should be: width (base length), height, and depth (thickness/extrusion).
   - Alternatively, use a 'box' or 'plane' rotated appropriately.
3. **Rotation**:
   - Detect angles of inclination.
   - Provide a 'rotation' vector [x, y, z] in radians for ALL objects that are not axis-aligned.
   - For a standard inclined plane (ramp) going up, rotate around Z (e.g., [0, 0, 0.52] for 30 degrees).
   - **Wheels**: If you see a wheel, ensure it is rotated to stand up (usually rotation [1.57, 0, 0] or [0, 0, 1.57] depending on orientation).
4. Extract physical constants (mass, gravity, friction, initial velocity).
5. Map coordinates: Y is UP. (0,0,0) is the scene origin.
6. Return color suggestions.

### Output Schema:
Return ONLY a JSON object with this structure:
{
  "scene_metadata": { "problem_type": "string", "units": "SI" },
  "entities": [
    {
      "name": "string",
      "type": "string", 
      "geometry": { 
        "shape": "sphere" | "box" | "plane" | "cylinder" | "cone" | "wedge", 
        "dimensions": { "radius": number, "width": number, "height": number, "depth": number },
        "color": "string (hex)"
      },
      "physics": { 
        "mass": number, 
        "position": [x, y, z], 
        "rotation": [x, y, z], 
        "velocity": [x, y, z],
        "is_static": boolean
      }
    }
  ],
  "environment": { "gravity": [x, y, z], "friction_coefficient": number }
}
`;

export const analyzePhysicsImage = async (file: File): Promise<PhysicsScene> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          },
          {
            text: "Compile this physics problem image into a 3D scene definition JSON.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid JSON response from AI");
    }

    // Sanitize and validate structure
    const safeData: PhysicsScene = {
        scene_metadata: {
            problem_type: data.scene_metadata?.problem_type || 'Physics Problem',
            units: data.scene_metadata?.units || 'SI',
        },
        entities: Array.isArray(data.entities) ? data.entities.map((e: any, i: number) => ({
            id: e.id || `entity-${i}`,
            name: e.name || `Object ${i + 1}`,
            type: e.type || 'object',
            geometry: {
                shape: e.geometry?.shape || 'box',
                dimensions: e.geometry?.dimensions || { width: 1, height: 1, depth: 1 },
                color: e.geometry?.color
            },
            physics: {
                mass: typeof e.physics?.mass === 'number' ? e.physics.mass : 1,
                position: Array.isArray(e.physics?.position) && e.physics.position.length === 3 ? e.physics.position : [0, 0, 0],
                rotation: Array.isArray(e.physics?.rotation) && e.physics.rotation.length === 3 ? e.physics.rotation : undefined,
                velocity: Array.isArray(e.physics?.velocity) && e.physics.velocity.length === 3 ? e.physics.velocity : [0, 0, 0],
                is_static: !!e.physics?.is_static
            }
        })) : [],
        environment: {
            gravity: Array.isArray(data.environment?.gravity) && data.environment.gravity.length === 3 ? data.environment.gravity : [0, -9.8, 0],
            friction_coefficient: typeof data.environment?.friction_coefficient === 'number' ? data.environment.friction_coefficient : 0.5
        }
    };

    return safeData;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
