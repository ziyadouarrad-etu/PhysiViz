import { GoogleGenAI, Chat } from "@google/genai";
import { PhysicsScene } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a "Physics Scene Compiler." Your task is to analyze physics problems (from images or text descriptions) and extract the COMPLETE state into a structured JSON format for a 3D simulation engine (Three.js).

### CRITICAL INSTRUCTION:
**DO NOT IGNORE ANY OBJECT.** You must extract every single visible or described element.
**COORDINATE SYSTEM**: 
- Y is UP. X is Right. Z is Forward/Backward.
- **Center the scene**: Place the main objects near (0,0,0). Do not use large offset coordinates (like y=300). Keep values between -20 and 20 relative units.

### Geometry & Shape Rules:
1.  **Ramps/Inclines**: 
    - PREFERRED: Use shape \`wedge\`. Dimensions: width (base width), height (vertical rise), depth (length along the slope).
    - ALTERNATIVE: Use shape \`plane\` (box). Dimensions: width, height (which maps to length/depth on ground).
2.  **Floors/Ground**: Use shape \`plane\`. 
    - **IMPORTANT**: A \`plane\` is assumed to be a FLAT BOX lying on the XZ plane by default. 
    - Dimensions: \`width\` (X size), \`height\` (Z size/depth). Thickness is auto-handled.
3.  **Springs**: Use shape \`spring\`. Dimensions: height (length), radius.
4.  **Pulleys**: Use shape \`pulley\`. Dimensions: radius, height (thickness).
5.  **Ropes**: Use shape \`cylinder\` with very small radius (e.g., 0.05).

### Rotation Rules (CRITICAL):
1.  **Inclined Planes**: 
    - If you use a \`plane\` for a ramp, you **MUST** provide a \`rotation\` vector [x, y, z] in radians.
    - Example: A ramp inclined 30 degrees up to the right might be rotation [0, 0, 0.52].
    - Since a plane is flat by default, rotating around Z creates a ramp.
2.  **Wedges**: 
    - Wedges are triangular prisms. Rotate them so the hypotenuse faces the correct way.
3.  **Wheels/Pulleys**: 
    - Default cylinder/pulley is flat like a coin. Rotate 90 deg (1.57 rad) to stand it up.

### Output Schema:
Return ONLY a JSON object with this structure:
{
  "scene_metadata": { "problem_type": "string", "units": "SI" },
  "entities": [
    {
      "name": "string",
      "type": "string", 
      "geometry": { 
        "shape": "sphere" | "box" | "plane" | "cylinder" | "cone" | "wedge" | "spring" | "pulley", 
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

const parseAndValidateResponse = (text: string): PhysicsScene => {
    let data;
    try {
      // Remove any markdown code block syntax if present
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid JSON response from AI");
    }

    // Sanitize and validate structure
    return {
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
};

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
            text: "Extract ALL physics objects. Center the scene at 0,0,0. Ensure inclined planes have rotation. Output JSON.",
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

    return parseAndValidateResponse(text);

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const analyzePhysicsPrompt = async (prompt: string): Promise<PhysicsScene> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              text: `Generate a 3D physics scene JSON based on this description: "${prompt}". Center objects at 0,0,0. Ensure inclined planes have rotation.`
            }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });
  
      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
  
      return parseAndValidateResponse(text);
  
    } catch (error) {
      console.error("Error analyzing prompt:", error);
      throw error;
    }
  };

export const createChatSession = (sceneData: PhysicsScene): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a friendly Physics Tutor. The student is viewing a 3D simulation of a physics problem.
      
      Here is the data for the current scene:
      ${JSON.stringify(sceneData, null, 2)}

      Your goal is to help them understand the physics concepts at play (forces, energy, kinematics) based on this specific setup.
      - Be concise and helpful.
      - Refer to specific objects by name (e.g., "The red sphere").
      - If asked to solve it, explain the steps using the variables provided.
      `,
    },
  });
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
