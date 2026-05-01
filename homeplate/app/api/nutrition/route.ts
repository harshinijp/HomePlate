import { NextRequest, NextResponse } from 'next/server'

async function getFatSecretToken() {
  const credentials = Buffer.from(
    `${process.env.EDAMAM_APP_ID}:${process.env.EDAMAM_APP_KEY}`
  ).toString('base64')

  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json()
  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  }

  try {
    const token = await getFatSecretToken()

    const results = await Promise.all(
      ingredients.map(async (ingredient: string) => {
        const res = await fetch(
          `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(ingredient)}&format=json&max_results=1`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        const data = await res.json()
        console.log('FULL RESPONSE for', ingredient, ':', JSON.stringify(data).slice(0, 500))

        const food = data.foods?.food
        const item = Array.isArray(food) ? food[0] : food
        if (!item) {
          console.log('NO ITEM FOUND for', ingredient)
          return null
        }

        console.log('RAW DESCRIPTION:', item.food_description)

        const desc = item.food_description || ''
        const cal     = parseFloat(desc.match(/Calories:\s*([\d.]+)/i)?.[1] || '0')
        const fat     = parseFloat(desc.match(/Fat:\s*([\d.]+)/i)?.[1] || '0')
        const carbs   = parseFloat(desc.match(/Carbs:\s*([\d.]+)/i)?.[1] || '0')
        const protein = parseFloat(desc.match(/Protein:\s*([\d.]+)/i)?.[1] || '0')

        console.log(`PARSED ${ingredient}: cal=${cal} fat=${fat} carbs=${carbs} protein=${protein}`)
        return { cal, fat, carbs, protein }
      })
    )

    let calories = 0, protein = 0, carbs = 0, fat = 0
    results.forEach(n => {
      if (!n) return
      calories += n.cal
      protein  += n.protein
      carbs    += n.carbs
      fat      += n.fat
    })

    return NextResponse.json({
      calories: Math.round(calories),
      protein_g: Math.round(protein * 10) / 10,
      carbs_g: Math.round(carbs * 10) / 10,
      fat_g: Math.round(fat * 10) / 10,
      fiber_g: 0,
      sodium_mg: 0,
      labels: [],
    })

  } catch (err) {
    console.error('FatSecret error:', err)
    return NextResponse.json({ error: 'Failed to fetch nutrition data' }, { status: 500 })
  }
}