import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json()

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  }

  const APP_ID = process.env.EDAMAM_APP_ID
  const APP_KEY = process.env.EDAMAM_APP_KEY

  if (!APP_ID || !APP_KEY) {
    return NextResponse.json({ error: 'Edamam API keys not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.edamam.com/api/nutrition-details?app_id=${APP_ID}&app_key=${APP_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingr: ingredients }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Could not analyze ingredients' }, { status: 422 })
    }

    const data = await response.json()
    const nutrients = data.totalNutrients

    const nutrition = {
      calories: Math.round(data.calories || 0),
      protein_g: Math.round((nutrients?.PROCNT?.quantity || 0) * 10) / 10,
      carbs_g: Math.round((nutrients?.CHOCDF?.quantity || 0) * 10) / 10,
      fat_g: Math.round((nutrients?.FAT?.quantity || 0) * 10) / 10,
      fiber_g: Math.round((nutrients?.FIBTG?.quantity || 0) * 10) / 10,
      sodium_mg: Math.round(nutrients?.NA?.quantity || 0),
      labels: data.healthLabels?.slice(0, 6) || [],
    }

    return NextResponse.json(nutrition)
  } catch (err) {
    console.error('Edamam error:', err)
    return NextResponse.json({ error: 'Failed to fetch nutrition data' }, { status: 500 })
  }
}