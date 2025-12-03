import { fromTable } from "@/app/api/utils/supabase";

export async function GET(request, { params }) {
  try {
    const slug = params?.slug;
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");

    if (!slug || !country || !city) {
      return new Response(
        JSON.stringify({ error: "Missing slug/country/city" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // resolve city
    const cityRows = await fromTable("city", {
      select: "id,country,city,name,timezone,currency,center_lat,center_lng",
      country: `eq.${country}`,
      city: `eq.${city}`,
      limit: "1",
    });
    const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;
    if (!cityRow) {
      return new Response(JSON.stringify({ error: "City not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // restaurant (must be published)
    const rows = await fromTable("restaurant", {
      select: "*",
      city_id: `eq.${cityRow.id}`,
      slug: `eq.${slug}`,
      published: "is.true",
      limit: "1",
    });
    const restaurant = Array.isArray(rows) ? rows[0] : null;
    if (!restaurant) {
      return new Response(JSON.stringify({ error: "Restaurant not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // images (published)
    const images = await fromTable("restaurant_images", {
      select: "*",
      restaurant_id: `eq.${restaurant.id}`,
      published: "is.true",
      order: "sort_order.asc",
      limit: "100",
    });

    return new Response(
      JSON.stringify({
        city: cityRow,
        restaurant,
        images: Array.isArray(images) ? images : [],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/blunari/restaurants/[slug] error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
