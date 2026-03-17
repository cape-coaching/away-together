import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user (the one you log in as)
  const kevin = await prisma.user.upsert({
    where: { email: "demo@awaytogether.app" },
    update: {},
    create: {
      username: "traveler_demo",
      email: "demo@awaytogether.app",
      name: "Kevin",
      bio: "Collecting experiences around the world",
    },
  });

  // Create some other users to populate match & feed
  const sarah = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      username: "sarah_adventures",
      email: "sarah@example.com",
      name: "Sarah Chen",
      bio: "Food lover + city explorer. Tokyo is home base.",
    },
  });

  const marco = await prisma.user.upsert({
    where: { email: "marco@example.com" },
    update: {},
    create: {
      username: "marco_travels",
      email: "marco@example.com",
      name: "Marco Rivera",
      bio: "Chasing sunsets and good espresso across Europe.",
    },
  });

  const aisha = await prisma.user.upsert({
    where: { email: "aisha@example.com" },
    update: {},
    create: {
      username: "aisha_wanders",
      email: "aisha@example.com",
      name: "Aisha Patel",
      bio: "Solo traveler. 34 countries and counting.",
    },
  });

  // Have them all follow each other so the feed populates
  const followPairs = [
    [kevin.id, sarah.id],
    [kevin.id, marco.id],
    [kevin.id, aisha.id],
    [sarah.id, kevin.id],
    [marco.id, kevin.id],
    [aisha.id, kevin.id],
  ];

  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
  }

  // Create locations around the world
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
        name: "Cafe de Flore",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        lat: 48.854,
        lng: 2.332,
        placeType: "restaurant",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "rialto_bridge_venice" },
      update: {},
      create: {
        googlePlaceId: "rialto_bridge_venice",
        name: "Rialto Bridge",
        city: "Venice",
        country: "Italy",
        countryCode: "IT",
        lat: 45.438,
        lng: 12.336,
        placeType: "museum",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "tsukiji_outer_market" },
      update: {},
      create: {
        googlePlaceId: "tsukiji_outer_market",
        name: "Tsukiji Outer Market",
        city: "Tokyo",
        country: "Japan",
        countryCode: "JP",
        lat: 35.665,
        lng: 139.770,
        placeType: "restaurant",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "blue_lagoon_iceland" },
      update: {},
      create: {
        googlePlaceId: "blue_lagoon_iceland",
        name: "Blue Lagoon",
        city: "Grindavik",
        country: "Iceland",
        countryCode: "IS",
        lat: 63.880,
        lng: -22.449,
        placeType: "park",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "la_boqueria_barcelona" },
      update: {},
      create: {
        googlePlaceId: "la_boqueria_barcelona",
        name: "La Boqueria Market",
        city: "Barcelona",
        country: "Spain",
        countryCode: "ES",
        lat: 41.382,
        lng: 2.172,
        placeType: "restaurant",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "tulum_beach" },
      update: {},
      create: {
        googlePlaceId: "tulum_beach",
        name: "Tulum Beach",
        city: "Tulum",
        country: "Mexico",
        countryCode: "MX",
        lat: 20.211,
        lng: -87.429,
        placeType: "beach",
      },
    }),
    prisma.location.upsert({
      where: { googlePlaceId: "raffles_hotel_singapore" },
      update: {},
      create: {
        googlePlaceId: "raffles_hotel_singapore",
        name: "Raffles Hotel",
        city: "Singapore",
        country: "Singapore",
        countryCode: "SG",
        lat: 1.295,
        lng: 103.854,
        placeType: "hotel",
      },
    }),
  ]);

  // Create check-ins with reviews and photos
  const checkinData = [
    { user: kevin, location: locations[0], rating: 5, review: "Walking through Gion at dusk was magical. The wooden machiya houses lit up and we spotted a maiko heading to an appointment.", occasion: "Couple", daysAgo: 3, photos: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80", "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80"] },
    { user: kevin, location: locations[1], rating: 4.5, review: "Classic Parisian cafe experience. The hot chocolate is legendary.", occasion: "Solo", daysAgo: 12, photos: ["https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80", "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"] },
    { user: kevin, location: locations[6], rating: 4, review: "Crystal clear water, incredible ruins overlooking the beach. Got there early to beat the crowds.", occasion: "Friends", daysAgo: 25, photos: ["https://images.unsplash.com/photo-1682553064958-bfe109db9e61?w=800&q=80", "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80"] },
    { user: sarah, location: locations[3], rating: 5, review: "Best tuna sashimi I've ever had. Go before 9am for the freshest picks. The tamagoyaki stalls are amazing too.", occasion: "Solo", daysAgo: 1, photos: ["https://images.unsplash.com/photo-1580442151529-343f2f6e0e27?w=800&q=80", "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80", "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80"] },
    { user: sarah, location: locations[0], rating: 4.5, review: "Cherry blossom season in Gion is unreal. Every corner is a photo op.", occasion: "Friends", daysAgo: 8, photos: ["https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80", "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80"] },
    { user: sarah, location: locations[7], rating: 4, review: "Had a Singapore Sling at the Long Bar where it was invented. Pure old-world charm.", occasion: "Work", daysAgo: 18, photos: ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80"] },
    { user: marco, location: locations[2], rating: 5, review: "Sunset from the bridge is breathtaking. Venice at golden hour is a different city.", occasion: "Couple", daysAgo: 2, photos: ["https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80", "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800&q=80", "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?w=800&q=80"] },
    { user: marco, location: locations[5], rating: 4.5, review: "Fresh juice, jamon iberico, seafood — sensory overload in the best way. Go hungry.", occasion: "Solo", daysAgo: 10, photos: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&q=80"] },
    { user: marco, location: locations[1], rating: 4, review: "People-watching capital of the world. Ordered just a coffee and stayed for 2 hours.", occasion: "Solo", daysAgo: 20, photos: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80"] },
    { user: aisha, location: locations[4], rating: 5, review: "Floating in milky blue water surrounded by volcanic landscape. Absolutely surreal experience.", occasion: "Solo", daysAgo: 4, photos: ["https://images.unsplash.com/photo-1515861461225-1488dfdaf0a8?w=800&q=80", "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80"] },
    { user: aisha, location: locations[6], rating: 4.5, review: "Rented bikes and explored the coast. The cenotes nearby are a must-do.", occasion: "Friends", daysAgo: 14, photos: ["https://images.unsplash.com/photo-1504730030853-eff311f57d3c?w=800&q=80", "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80"] },
    { user: aisha, location: locations[2], rating: 4, review: "Got lost in the back alleys and found the best cicchetti bar. That's the real Venice.", occasion: "Solo", daysAgo: 22, photos: ["https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80", "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800&q=80"] },
  ];

  for (const d of checkinData) {
    await prisma.checkin.create({
      data: {
        userId: d.user.id,
        locationId: d.location.id,
        rating: d.rating,
        reviewText: d.review,
        occasionTag: d.occasion,
        visitedDate: new Date(Date.now() - d.daysAgo * 24 * 60 * 60 * 1000),
        photoUrls: d.photos,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  - 4 users (Kevin + 3 travelers)`);
  console.log(`  - ${locations.length} locations`);
  console.log(`  - ${checkinData.length} check-ins`);
  console.log(`  - ${followPairs.length} follow connections`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
