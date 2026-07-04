import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean the database in order of dependencies
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Database cleared.");

  // Hash passwords
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create demo users
  const user1 = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@boardhub.com",
      password: passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Collaborator",
      email: "colleague@boardhub.com",
      password: passwordHash,
    },
  });

  console.log(`👤 Users seeded: ${user1.email}, ${user2.email}`);

  // 2. Create Capstone project
  const project = await prisma.project.create({
    data: {
      name: "Capstone Project Development",
      description: "Track all tasks needed to complete the full-stack capstone project by Thursday.",
      ownerId: user1.id,
      members: {
        connect: [{ id: user1.id }, { id: user2.id }],
      },
    },
  });

  console.log(`📁 Project seeded: "${project.name}"`);

  // 3. Seed Tasks
  const tasksData = [
    {
      title: "Design Database Entity Schema",
      description: "Formulate relational schema for User, Project, and Task models.",
      status: "DONE",
      priority: "HIGH",
      ownerId: user1.id,
      assigneeId: user1.id,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    },
    {
      title: "Implement JWT Access & Refresh Token Service",
      description: "Build robust authentication routes and secure token rotation with httpOnly cookies.",
      status: "DONE",
      priority: "HIGH",
      ownerId: user1.id,
      assigneeId: user1.id,
      dueDate: new Date(),
    },
    {
      title: "Build Kanban Board Component",
      description: "Develop the drag-and-drop or column status transition UI in the React client.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      ownerId: user1.id,
      assigneeId: user1.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
    },
    {
      title: "Write Integration Tests using Supertest",
      description: "Write mock API request tests to assert auth endpoints and CRUD endpoints.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      ownerId: user1.id,
      assigneeId: user2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
    },
    {
      title: "Configure Docker & Multi-stage Dockerfiles",
      description: "Containerize the Node.js API server and React frontend with static serving via Nginx.",
      status: "TODO",
      priority: "MEDIUM",
      ownerId: user1.id,
      assigneeId: user2.id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
    },
    {
      title: "Draft System Documentation & Architecture Diagram",
      description: "Prepare README.md detailing local installation steps and API endpoints catalog.",
      status: "TODO",
      priority: "LOW",
      ownerId: user1.id,
      assigneeId: null,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
    },
  ];

  for (const task of tasksData) {
    const createdTask = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: project.id,
        ownerId: task.ownerId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
      },
    });
    console.log(`📌 Task seeded: "${createdTask.title}" (${createdTask.status})`);
  }

  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
