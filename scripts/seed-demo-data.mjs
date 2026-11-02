import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DATABASE_NAME = process.env.MONGODB_DB || "social_media";
const USER_ID_START = 900001;
const POST_ID_START = 910001;
const USER_COUNT = 20;
const POST_COUNT = 25;
const SEED_NAME = "demo-data-v1";
const DEMO_PASSWORD = "DemoPass123!";

const covers = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
];

const postIdeas = [
  ["Navigating Life's Waves: Finding Your Balance", "Sometimes life feels like an ocean. The key is learning how to ride the waves instead of fighting them. Focus on what you can control, let go of the rest, and find your center amidst the movement. How are you finding balance today?", ["life balance", "inner peace", "mindfulness", "personal growth", "water therapy"]],
  ["Rise and Shine: Unlocking Your Morning Potential", "The way we start our morning sets the tone for the entire day. Whether it's five minutes of meditation, a nutritious meal, or simply savoring a quiet cup of coffee, intentional mornings change everything. What's the ONE ritual you can't skip?", ["morning routine", "productivity hacks", "wellbeing", "healthy start", "rise and shine"]],
  ["The Art of Saying No (So You Can Say Yes to What Matters)", "Boundaries aren't walls; they are gates that let the right things in and keep the distracting things out. Learning to say 'no' to things that don't align with your goals or energy allows you to fully commit to what does. This is self-care.", ["healthy boundaries", "self care", "time management", "focus", "priority setting"]],
  ["Chasing Sunlight: The Best Coastal Road Trips", "Is there anything more liberating than the open road? Coastal routes like the Pacific Coast Highway, Amalfi Coast, and Great Ocean Road are perfect for when you need to feel the wind in your hair and see the horizon. Ready to pack?", ["road trip", "coastal drive", "travelgram", "adventure awaits", "wanderlust"]],
  ["Local Gems: Discovering Hidden Magic in Your City", "You don't always need to go far to find something extraordinary. Sometimes the most beautiful spots are hidden in plain sight. Shine a light on an amazing local place and go check it out before everyone else does.", ["shop local", "hidden gems", "city guides", "support local business", "explore your city"]],
  ["Mountain High: Why Everyone Needs Altitude Therapy", "There is something incredibly grounding about being small in the presence of mountains. The fresh air, the silence, and the sheer scale reset your perspective. When was the last time you escaped to higher ground?", ["mountain life", "hiking adventures", "nature heals", "altitude", "travel photography"]],
  ["The Creativity Reset: Simple Ways to Break a Slump", "Feel stuck creatively? Sometimes the best way to get inspired is to step away from the problem. Try changing your environment, reading something unrelated, or simply walking outside. Action breeds inspiration. What's your slump-breaker?", ["creative process", "overcoming blocks", "inspiration", "artist tips", "side hustle life"]],
  ["Beyond the Salary: The True Meaning of Success", "We often define success by milestones like salary or job titles. But true success also includes time freedom, mental health, and the impact you have. It's okay to redefine success on your own terms.", ["career advice", "success mindset", "work life balance", "entrepreneur life", "fulfilment"]],
  ["Essential Tech for the Modern Creative", "You don't need every gadget, but the right tools make a world of difference. These are the pieces of tech that genuinely improve workflow and creativity. What's the one tool you can't live without?", ["creative tools", "tech gear", "remote work", "design life", "content creator"]],
  ["The Sunday Meal Prep Ritual: Fuel Your Week", "I don't have time to eat healthy ends today. Sunday prepping for just one or two hours makes healthy choices effortless during the busy week. Your Tuesday self will thank you.", ["meal prep", "healthy eating", "sunday reset", "nutrition tips", "fuel your body"]],
  ["Mindful Eating: More Than Just Food on a Plate", "We often eat on autopilot. For one meal today, put down your phone, turn off the TV, and really taste your food. Appreciate the texture, flavor, and origin. Eat slowly and with gratitude.", ["mindful eating", "intuitive eating", "food break", "wellness journey", "healthy habits"]],
  ["Decadence Done Right: The Perfect Recipe", "Wellness is about balance, and sometimes balance is a really good dessert. This recipe is a favorite for when you need a little or big treat.", ["dessert lover", "bakinggram", "treat yourself", "foodie", "indulgence"]],
  ["The Power of Plants: Bringing Nature Indoors", "If your space feels a bit dull, the answer is usually: add more plants. They breathe life into a room, improve air quality, and boost your mood. Start with a hardy Pothos and see where it leads you.", ["plant parenthood", "urban jungle", "home decor", "interior design", "plant life"]],
  ["Small Space, Big Impact: Simple Styling Secrets", "Don't let a small footprint limit your style. Use mirrors to create the illusion of space, vertical storage to maximize walls, and a cohesive color palette. The goal is intentional, not cluttered.", ["small space style", "decor hacks", "tiny living", "minimalist home", "home organization"]],
  ["Cozy Minimalism: Where Calm Meets Comfort", "Minimalism doesn't have to feel cold or sterile. Cozy minimalism is about using fewer things, but choosing items that feel meaningful, comfortable, and warm. It creates visual and mental calm.", ["cozy minimalism", "interior styling", "hygge home", "simple living", "calm spaces"]],
  ["The 20-Minute At-Home Full Body Blast", "No gym? No problem. This 20-minute bodyweight routine requires zero equipment and hits every muscle group. Consistency is more important than duration. Are you in?", ["at home workout", "fitness motivation", "bodyweight exercise", "quick workouts", "health journey"]],
  ["Listening to Your Body: Rest Days Are Training Days", "Pushing hard is important, but recovery is essential. Your muscles grow and your mind resets on rest days. If you're feeling sluggish or sore, honor that. Active recovery or a total rest day is still progress.", ["rest day", "fitness tips", "active recovery", "self care", "wellness"]],
  ["Stretch and Flow: Mobility for Everyday Life", "It's not just about strength; it's about movement. Better mobility improves posture, reduces pain, and helps with daily activities. Dedicate 10 minutes a day to gentle stretching and feel the difference.", ["yoga flow", "mobility", "stretching routine", "flexibility", "mind body"]],
  ["AI Explained: How Machine Learning Actually Works", "You hear AI everywhere, but what is it? Think of machine learning like teaching a computer to recognize patterns by showing it millions of examples until it can make predictions on its own. Simple, but powerful.", ["explainable ai", "tech talk", "future of tech", "ai everyday", "machine learning"]],
  ["The Privacy Paradox: Navigating a Connected World", "We love convenience, but what are we trading? Finding the balance between staying connected and protecting our data privacy is one of the biggest challenges of our time. Check your privacy settings today.", ["data privacy", "cyber security", "tech ethics", "digital citizen", "privacy settings"]],
  ["Tech for Good: Innovation Changing Lives", "Technology gets a bad rap, but when used intentionally, it solves massive global challenges. Clean water access, accessible healthcare, and thoughtful innovation can improve lives.", ["tech for good", "social impact", "innovation", "global development", "positive tech"]],
  ["Overcoming Perfectionism: The Trap of Just a Little More", "Waiting for perfect is a fancy way of procrastinating. Perfect is the enemy of done. Launch the project, have the conversation, and start the hobby. Progress is messier than perfection, but it's real.", ["progress not perfection", "done is better", "perfectionism", "growth mindset", "take action"]],
  ["The Gift of Discomfort: Why Getting Outside Your Zone Matters", "Everything you want is usually on the other side of comfortable. Growth happens in moments where you feel slightly scared, unsure, or exposed. Lean into that discomfort; it's a sign you're expanding.", ["growth zone", "personal challenge", "self discovery", "overcome fear", "mindset"]],
  ["The Ripple Effect of Gratitude", "Gratitude changes your internal state, which changes how you interact with the world, which changes the world around you. Today, notice two small, specific things you appreciate.", ["gratitude journal", "positive vibes", "mindfulness", "kindness matters", "daily gratitude"]],
  ["Weekend Challenge: What's Your Hobby Question?", "Let's talk about hobbies. What is the single biggest question or challenge you have with baking, knitting, photography, reading, or another hobby right now? Let's troubleshoot together in the comments!", ["weekend hobbies", "creative community", "hobbyist", "learn together", "q and a"]],
];

const names = [
  "Aarav Mehta", "Anaya Sharma", "Arjun Rao", "Diya Kapoor",
  "Kabir Singh", "Meera Nair", "Rohan Das", "Ishita Verma",
  "Vihaan Patel", "Naina Joshi", "Aditya Menon", "Tara Iyer",
  "Dev Malhotra", "Sara Khan", "Kian Bose", "Maya Reddy",
  "Neil Thomas", "Aisha Roy", "Yuvan Gupta", "Zoya Ali",
];

function buildUsers(passwordHash) {
  return names.map((userName, index) => {
    const userId = USER_ID_START + index;
    const handle = userName.toLowerCase().replaceAll(" ", "");

    return {
      userId,
      seed: SEED_NAME,
      userName,
      handle,
      email: `${handle}@demo.local`,
      password: passwordHash,
      bio: `Demo profile for ${userName}. Interested in thoughtful ideas and useful conversations.`,
      dp: "/user.png",
      posts: [],
      likes: [],
      comments: [],
      followed: [],
      followers: [],
      request_sent: [],
      request_came: [],
      bookmarks: [],
      chats: [],
    };
  });
}

function buildPosts(users) {
  return Array.from({ length: POST_COUNT }, (_, index) => {
    const postId = POST_ID_START + index;
    const author = users[index % users.length];
    const [title, content, tags] = postIdeas[index];
    const published = index < 20;

    return {
      postId,
      seed: SEED_NAME,
      userId: author.userId,
      authorId: author.userId,
      title,
      content: `<p>${content}</p>`,
      createdAt: new Date(Date.UTC(2026, 0, index + 1)),
      ...(published ? { publishedAt: new Date(Date.UTC(2026, 0, index + 2)) } : {}),
      status: published ? "published" : "draft",
      category: tags[0],
      categories: tags[0],
      tags: [...tags, "demo", "seed"],
      cover: covers[index % covers.length],
      likes: index * 3,
      comments: [],
    };
  });
}

async function assertNoUnrelatedCollisions(collection, ids, type) {
  const collisions = await collection
    .find({ [type === "users" ? "userId" : "postId"]: { $in: ids }, seed: { $ne: SEED_NAME } })
    .project({ _id: 1 })
    .limit(1)
    .toArray();

  if (collisions.length > 0) {
    throw new Error(`Reserved demo ${type} IDs are already used by non-demo data.`);
  }
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const users = buildUsers(passwordHash);
    const posts = buildPosts(users);

    await assertNoUnrelatedCollisions(
      usersCollection,
      users.map((user) => user.userId),
      "users",
    );
    await assertNoUnrelatedCollisions(
      postsCollection,
      posts.map((post) => post.postId),
      "posts",
    );

    for (const user of users) {
      await usersCollection.updateOne(
        { userId: user.userId, seed: SEED_NAME },
        { $set: user },
        { upsert: true },
      );
    }

    for (const post of posts) {
      await postsCollection.updateOne(
        { postId: post.postId, seed: SEED_NAME },
        { $set: post },
        { upsert: true },
      );
      await usersCollection.updateOne(
        { userId: post.userId, seed: SEED_NAME },
        { $addToSet: { posts: post.postId } },
      );
    }

    console.log(`Seeded ${USER_COUNT} users and ${POST_COUNT} posts.`);
    console.log(`Demo password for every seeded user: ${DEMO_PASSWORD}`);
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error("Demo data seed failed:", error.message);
  process.exitCode = 1;
});
