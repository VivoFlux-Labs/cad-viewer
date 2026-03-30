import { NextResponse } from 'next/server';

export async function GET() {
  // Simulating database lookup for 3D Product Catalog Context
  const models = [
    { id: 'cube', name: 'Primitive Cube', url: '/demo.glb' },
    { id: 'duck', name: 'Rubber Duck', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb' },
    { id: 'car', name: 'Concept Car', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb' },
    { id: 'engine', name: '2Cylinder Engine', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb' },
    { id: 'damagedHelmet', name: 'Battle Helmet', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb' }
  ];

  return NextResponse.json({ models });
}
