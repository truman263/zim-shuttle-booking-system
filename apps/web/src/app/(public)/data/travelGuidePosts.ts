export type TravelGuidePost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  intro: string;
  sections: {
    heading: string;
    body: string[];
  }[];
};

export const travelGuidePosts: TravelGuidePost[] = [
  {
    title: "How to plan a Harare airport transfer before you arrive",
    slug: "harare-airport-transfer-planning-guide",
    category: "Airport Transfers",
    readTime: "4 min read",
    excerpt:
      "Prepare your arrival time, passenger details, pickup notes and luggage information before requesting airport transfer support.",
    intro:
      "A smooth Harare airport transfer starts before landing. Sharing the right details helps the team understand the arrival, the passengers and the onward journey before confirmation.",
    sections: [
      {
        heading: "Share the arrival details clearly",
        body: [
          "Before you request Robert Gabriel Mugabe International Airport pickup support, keep the arrival date, expected landing time, airline details and passenger count close by. These details help the team understand when you are expected, who is travelling and where the pickup should be arranged.",
          "It also helps to add a simple note about the pickup point, onward destination and any timing concerns. A clear request reduces back-and-forth and gives the operations team enough information to review the journey before confirmation.",
        ],
      },
      {
        heading: "Include luggage and passenger notes",
        body: [
          "Airport transfer customers often arrive with suitcases, hand luggage, families, visitors or business guests. Mentioning luggage needs and passenger notes makes the request more practical, especially when the vehicle assignment has to suit the group.",
          "If anyone needs extra time at arrivals, is travelling with children or is being collected on behalf of a company, add that context early. The goal is not to overcomplicate the booking; it is to make the pickup feel organised before travel begins.",
        ],
      },
      {
        heading: "Keep the booking reference safe",
        body: [
          "After submitting a request, the booking reference becomes the easiest way to follow the trip. It helps you check the latest status online without repeating all of your travel details every time you need an update.",
          "Keep the reference somewhere accessible until the trip is complete. It is useful for airport transfers, payment follow-up and any changes that may need to be reviewed by the team.",
        ],
      },
    ],
  },
  {
    title: "What to know before booking private shuttle hire in Zimbabwe",
    slug: "private-shuttle-hire-zimbabwe-guide",
    category: "Private Shuttle Hire",
    readTime: "4 min read",
    excerpt:
      "A practical guide for families, visitors and small groups planning private shuttle travel across Zimbabwe.",
    intro:
      "Private shuttle hire Zimbabwe requests work best when the pickup, destination, date and group details are clear from the beginning.",
    sections: [
      {
        heading: "Confirm who is travelling",
        body: [
          "Private shuttle hire works best when the passenger count is clear from the start. Share how many people will travel, whether the group includes children or visitors, and whether the journey is for one person, a family or a small group.",
          "Luggage notes also matter. Even when the route is simple, the vehicle needs to make sense for the passengers and the bags they are carrying.",
        ],
      },
      {
        heading: "Explain the route",
        body: [
          "Add the pickup point, destination and any useful location notes. If the trip is within Harare, mention the suburb, office, hotel or landmark. If it is a longer journey, include the destination city and preferred departure time.",
          "For custom Zimbabwe routes, the details are reviewed before confirmation. Clear route information helps the team understand whether the journey matches a saved route or needs custom review.",
        ],
      },
      {
        heading: "Use booking tracking after submission",
        body: [
          "Once the request has been submitted, the booking reference keeps the trip easy to follow. You can use it to check the status of the request and keep the important details in one place.",
          "This is especially useful when several people are travelling together or when the trip is being arranged on behalf of someone else.",
        ],
      },
    ],
  },
  {
    title: "Corporate transport in Harare: planning smoother business movement",
    slug: "corporate-transport-harare-guide",
    category: "Corporate Travel",
    readTime: "4 min read",
    excerpt:
      "How clear timing, passenger information and route details help business travellers and teams move with less stress.",
    intro:
      "Corporate transport Harare requests often depend on timing, passenger coordination and clear pickup instructions.",
    sections: [
      {
        heading: "Prepare the movement schedule",
        body: [
          "Corporate transport in Harare often depends on timing. Meeting times, arrival windows, pickup points and onward destinations should be shared clearly so the team can understand the movement before confirmation.",
          "If the trip involves business visitors, executives or staff movement, it helps to include the order of stops and any timing that should not be missed.",
        ],
      },
      {
        heading: "Add passenger and route details",
        body: [
          "Passenger information gives the team a practical view of the trip. Add the number of travellers, the main contact person and the destination details so the movement can be reviewed properly.",
          "For business travel, even small details can help: whether the pickup is from an office, airport, hotel or event venue, and whether the trip is one-way or returning.",
        ],
      },
      {
        heading: "Keep communication simple",
        body: [
          "A clear booking request keeps communication simple. Instead of sending separate notes after the request, include the important timing, passenger and route details from the beginning.",
          "That gives the operations team the information needed to review availability, confirm the details and support a smoother business movement.",
        ],
      },
    ],
  },
  {
    title: "City-to-city shuttle travel in Zimbabwe: what details to prepare",
    slug: "city-to-city-shuttle-travel-zimbabwe",
    category: "Travel Planning",
    readTime: "4 min read",
    excerpt:
      "Know what to share when requesting longer-distance shuttle travel, including pickup, destination, date and luggage notes.",
    intro:
      "City-to-city shuttle Zimbabwe journeys need enough detail for route review, timing and confirmation before travel.",
    sections: [
      {
        heading: "Start with the route",
        body: [
          "For city-to-city shuttle travel, start with the pickup point, destination city, travel date and preferred timing. Longer-distance journeys need enough detail for the route and travel time to be reviewed properly.",
          "This is useful for requests such as Harare to Masvingo, Harare to Bulawayo, Harare to Mutare or other Zimbabwe destinations where timing and route planning matter.",
        ],
      },
      {
        heading: "Add luggage and stop notes",
        body: [
          "Longer trips may involve more luggage, planned stops or a specific pickup arrangement. Add anything the team should know before confirming the trip.",
          "A few extra notes can help the team understand whether the journey is straightforward or whether it needs a custom route review before the fare and timing are confirmed.",
        ],
      },
      {
        heading: "Request custom routes when needed",
        body: [
          "If your destination does not match a saved route, you can still submit your own pickup and destination details. Custom route requests are reviewed before confirmation.",
          "This keeps the booking process flexible without promising that every destination is automatically available. The team can review the journey and follow up with the appropriate details.",
        ],
      },
    ],
  },
  {
    title: "Airport pickup checklist for visitors arriving in Zimbabwe",
    slug: "airport-pickup-checklist-zimbabwe",
    category: "Travel Checklist",
    readTime: "3 min read",
    excerpt:
      "A simple checklist for visitors preparing for airport pickup, onward travel and booking follow-up.",
    intro:
      "Visitors arriving in Zimbabwe can make airport pickup easier by preparing a few details before submitting a shuttle request.",
    sections: [
      {
        heading: "Prepare arrival and passenger details",
        body: [
          "Keep the arrival date, expected time, passenger count and contact details ready before requesting airport transfer support. This makes the first booking step much easier.",
          "If the pickup is for a visitor, business guest or family member, include the traveller's name and the best person to contact about the booking.",
        ],
      },
      {
        heading: "Share the onward destination",
        body: [
          "Whether the next stop is a hotel, home, office or another city, destination details help the team understand the journey. Add the exact address when you have it, or a clear landmark when the address is still being confirmed.",
          "For airport pickup and drop-off requests, the onward destination gives the team better context for timing and route review.",
        ],
      },
      {
        heading: "Track the request after booking",
        body: [
          "Use the booking reference to follow the request and check the latest trip information online. This keeps follow-up simple after the booking form has been submitted.",
          "If you are arranging the trip for someone else, share the reference with the person responsible for tracking the booking status.",
        ],
      },
    ],
  },
];

export const featuredTravelGuidePost = travelGuidePosts[0];

export function getTravelGuidePost(slug: string) {
  return travelGuidePosts.find((post) => post.slug === slug);
}
