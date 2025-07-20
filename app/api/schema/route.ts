import { NextRequest, NextResponse } from "next/server";
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

    // Get all tables in 'public' schema
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);
    const schema: {
      name: string;
      columns: { name: string; type: string; nullable: boolean }[];
    }[] = [];

    for (const table of tables as any[]) {
      const tableName = table.table_name;

      const [columns] = await sequelize.query(
        `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = :tableName 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
        {
          replacements: { tableName },
        }
      );

      schema.push({
        name: tableName,
        columns: (columns as any[]).map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
        })),
      });
    }

    return NextResponse.json({ tables: schema });
  } catch (error: any) {
    console.error("Schema fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schema" },
      { status: 500 }
    );
  }
}
