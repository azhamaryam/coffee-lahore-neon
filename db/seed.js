require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { neon } = require('@neondatabase/serverless');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@coffeelahore.pk').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345';
const CREATOR_EMAIL = 'creator@coffeelahore.pk';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first (see .env.example).');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  // --- Admin account ---
  const existingAdmin = await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;
  if (!existingAdmin.length) {
    await sql`
      INSERT INTO users (id, name, email, password, is_admin, is_creator, created_at)
      VALUES (${uuidv4()}, 'Admin', ${ADMIN_EMAIL}, ${bcrypt.hashSync(ADMIN_PASSWORD, 10)}, true, false, now())
    `;
    console.log('✔ Admin account created');
    console.log(`   email:    ${ADMIN_EMAIL}`);
    console.log(`   password: ${ADMIN_PASSWORD}`);
  } else {
    console.log('✔ Admin account already exists — skipping.');
  }

  // --- Sample cafes & drinks ---
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM cafes`;
  let firstCafeId = null;

  if (count === 0) {
    const cafes = [
      { id: uuidv4(), name: 'Chaye Khana', area: 'Gulberg', description: 'A rustic, plant-filled cafe tucked into Gulberg, known for its slow pour-overs and quiet corners perfect for reading.' },
      { id: uuidv4(), name: 'Cafe Aylanto', area: 'MM Alam Road', description: 'A long-time MM Alam favorite with a warm, wood-panelled interior and a menu that pairs coffee with hearty breakfasts.' },
      { id: uuidv4(), name: 'The Coffee Bean & Tea Leaf', area: 'DHA', description: 'A relaxed DHA spot popular with students, known for its iced coffees and reliable wifi for long study sessions.' },
      { id: uuidv4(), name: 'Second Cup', area: 'Johar Town', description: 'Bright, airy and always buzzing — a solid choice for catching up with friends over a latte.' },
      { id: uuidv4(), name: 'Cafe Bogey', area: 'Cavalry Ground', description: 'An intimate neighborhood cafe with a short, thoughtful menu and some of the friendliest baristas in the city.' }
    ];
    for (const c of cafes) {
      await sql`
        INSERT INTO cafes (id, name, area, description, image_url, created_at)
        VALUES (${c.id}, ${c.name}, ${c.area}, ${c.description}, '', now())
      `;
    }
    firstCafeId = cafes[0].id;

    const drinks = [
      { cafeId: cafes[0].id, name: 'Ethiopian Pour Over', description: 'Bright, fruity single-origin beans, brewed slow.', price: 'Rs. 800' },
      { cafeId: cafes[0].id, name: 'Cardamom Cold Brew', description: 'Cold brew infused with a hint of cardamom.', price: 'Rs. 700' },
      { cafeId: cafes[1].id, name: 'Caramel Macchiato', description: 'Smooth espresso, steamed milk, caramel drizzle.', price: 'Rs. 650' },
      { cafeId: cafes[2].id, name: 'Iced Vanilla Latte', description: 'Chilled and creamy — a Lahore-summer staple.', price: 'Rs. 700' },
      { cafeId: cafes[3].id, name: 'Hazelnut Cappuccino', description: 'Nutty and comforting, topped with cocoa dust.', price: 'Rs. 600' },
      { cafeId: cafes[4].id, name: 'Pistachio Latte', description: 'A house special — creamy, nutty, lightly sweet.', price: 'Rs. 750' }
    ];
    for (const d of drinks) {
      await sql`
        INSERT INTO drinks (id, cafe_id, name, description, price, image_url, created_at)
        VALUES (${uuidv4()}, ${d.cafeId}, ${d.name}, ${d.description}, ${d.price}, '', now())
      `;
    }
    console.log('✔ Sample cafes and drinks added.');
  } else {
    console.log('✔ Sample cafes already exist — skipping.');
    const [first] = await sql`SELECT id FROM cafes ORDER BY created_at ASC LIMIT 1`;
    firstCafeId = first ? first.id : null;
  }

  // --- Sample Creator account + a demo rating/review ---
  const existingCreator = await sql`SELECT id FROM users WHERE email = ${CREATOR_EMAIL}`;
  if (!existingCreator.length) {
    const creatorId = uuidv4();
    await sql`
      INSERT INTO users (id, name, email, password, is_admin, is_creator, created_at)
      VALUES (${creatorId}, 'Sara Khan', ${CREATOR_EMAIL}, ${bcrypt.hashSync('creator12345', 10)}, false, true, now())
    `;
    console.log('✔ Sample creator account created');
    console.log(`   email:    ${CREATOR_EMAIL}`);
    console.log(`   password: creator12345`);

    if (firstCafeId) {
      await sql`
        INSERT INTO ratings (id, cafe_id, user_id, ambiance, service, food, drinks, created_at)
        VALUES (${uuidv4()}, ${firstCafeId}, ${creatorId}, 5, 4, 4, 5, now())
      `;
      await sql`
        INSERT INTO comments (id, cafe_id, user_id, user_name, is_creator, text, created_at)
        VALUES (
          ${uuidv4()}, ${firstCafeId}, ${creatorId}, 'Sara Khan', true,
          ${'Visited on a quiet weekday morning and the pour-over here is genuinely one of the best in Gulberg. The space is calm, the staff know their beans, and it is an easy recommend for anyone who takes their coffee seriously.'},
          now()
        )
      `;
    }
  } else {
    console.log('✔ Sample creator account already exists — skipping.');
  }

  console.log('\nTip: in the Admin panel → Users tab, you can mark any signed-up account as a Creator.');
}

seed().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
