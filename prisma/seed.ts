import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@awaytogether.app" },
    update: {},
    create: {
      username: "traveler_demo",
      email: "demo@awaytogether.app",
      name: "Demo Traveler",
      bio: "Collecting experiences around the world ✈️",
    },
  });

  // Create locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { googlePlaceId: "gion_kyoto" },
      update: {},
      create: {
        googlePlaceId: "gion_kyoto",
        name: "Gion District",
        city: "Kyoto",
        country: "Japan",
        countryCode: "JP",
        lat: 35.005,
        lng: 135.775,
        placeType: "neighborhood",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "cafe_de_flore_paris" },
      update: {},
      create: {
        googlePlaceId: "cafe_de_flore_paris",
        name: "Café de Flore",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.854,
        lng: 2.332,
        placeType: "restaurant",
      },
    }),
  ]);

  // Create checkins
  for (const [i, loc] of locations.entries()) {
    await prisma.checkin.create({
      data: {
        userId: user.id,
        locationId: loc.id,
        rating: 4.5,
        reviewText: "Amazing experience, highly recommend visiting.",
        occasionTag: i === 0 ? "culture" : "food",
        visitedDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
