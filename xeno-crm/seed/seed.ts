import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"];
const products = ["Sneakers", "Kurta", "Jeans", "Dress", "Jacket", "Bag", "Watch"];

function getRandomChannel(): string {
  const rand = Math.random();
  if (rand < 0.60) return "whatsapp";
  if (rand < 0.85) return "email";
  return "sms";
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.message.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log("Generating 200 customers...");
  const uniqueCustomers: any[] = [];
  const emailsSeen = new Set<string>();

  while (uniqueCustomers.length < 200) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    if (!emailsSeen.has(email)) {
      emailsSeen.add(email);
      // Format phone to be just digits and + to make it easier for our simulator
      let phone = faker.phone.number().replace(/[^0-9+]/g, '');
      if (!phone.startsWith('+')) {
        phone = '+91' + phone;
      }
      uniqueCustomers.push({
        name,
        email,
        phone: phone.substring(0, 15), // ensure within db/varchar limit if any
        channel: getRandomChannel(),
        city: faker.helpers.arrayElement(cities),
      });
    }
  }

  console.log(`Inserting ${uniqueCustomers.length} unique customers and their orders...`);

  for (const customerData of uniqueCustomers) {
    const customer = await prisma.customer.create({
      data: customerData,
    });

    const orderCount = faker.number.int({ min: 2, max: 8 });
    const orders = [];
    for (let o = 0; o < orderCount; o++) {
      const createdAt = faker.date.past({ years: 1.5 });
      const amount = parseFloat(faker.number.float({ min: 200, max: 8000 }).toFixed(2));
      const itemCount = faker.number.int({ min: 1, max: 4 });
      const items = faker.helpers.arrayElements(products, itemCount);

      orders.push({
        customerId: customer.id,
        amount,
        items,
        createdAt,
      });
    }

    await prisma.order.createMany({
      data: orders,
    });
  }

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
