import { type NextRequest, NextResponse } from "next/server";
import { Sequelize } from "sequelize";

export async function POST(request: NextRequest) {
  try {
    const { host, user, password, database, port } = await request.json();

    // Validate input
    if (!host || !user || !password || !database || !port) {
      return NextResponse.json(
        { error: "All connection fields are required" },
        { status: 400 }
      );
    }

    // Create Sequelize instance
    const sequelize = new Sequelize({
      dialect: "postgres",
      host,
      port: Number.parseInt(port),
      username: user,
      password,
      database,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: {
          require: true,         // Enforces SSL
          rejectUnauthorized: false, // Set to true if you have a trusted CA
        },
      },
      logging: false,
    });

    // Test connection
    await sequelize.authenticate();

    return NextResponse.json({
      success: true,
      data: {
        host,
        user,
        password,
        database,
        port: Number.parseInt(port)
      },
    });
  } catch (error: any) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to database" },
      { status: 500 }
    );
  }
}
