import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sequelize } from "sequelize";

type Column = {
  name: string;
  type: string;
  nullable: boolean;
  foreign_key?: string | null;
};

type TableSchema = {
  table_name: string;
  columns: Column[];
};

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

    // Get schema for context
    const [tables] = await sequelize.query(`
      SELECT 
        t.table_name,
        json_agg(
          json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'foreign_key', fk.references
          )
          ORDER BY c.ordinal_position
        ) AS columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT 
          kcu.table_name,
          kcu.column_name,
          '-> ' || ccu.table_name || '.' || ccu.column_name AS references
        FROM 
          information_schema.table_constraints tc
        JOIN 
          information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN 
          information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk 
        ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
    `);

    const schemaContext = (tables as TableSchema[])
      .map((table) => {
        const columnDescriptions = table.columns
          .map((col) => {
            let desc = `${col.name} (${col.type})`;
            if (col.foreign_key) {
              desc += ` [FK ${col.foreign_key}]`;
            }
            return desc;
          })
          .join(", ");

        return `Table: ${table.table_name}\nColumns: ${columnDescriptions}`;
      })
      .join("\n\n");

    return NextResponse.json({
      success: true,
      data: { schemaContext },
    });


  } catch (error: any) {
    console.error("Query processing error:", error);

    // Handle specific error types
    if (
      error.message?.includes("relation") &&
      error.message?.includes("does not exist")
    ) {
      return NextResponse.json(
        { error: "Table or column not found in database" },
        { status: 400 }
      );
    }

    if (error.message?.includes("syntax error")) {
      return NextResponse.json(
        { error: "Invalid SQL syntax generated" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process query" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
      const { searchParams } = new URL(request.url);

      const query = searchParams.get("query");
      const host = searchParams.get("host");
      const port = searchParams.get("port");
      const user = searchParams.get("user");
      const password = searchParams.get("password");
      const database = searchParams.get("database");

    // Validate input
    if (!query || !host || !port || !user || !password || !database) {
      return NextResponse.json(
        { error: "All Fields are required" },
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

    // Execute SQL
    const results = await sequelize.query(query);
    return NextResponse.json({
      results,
    });
  } catch (error: any) {
    console.error("Query processing error:", error);

    // Handle specific error types
    if (
      error.message?.includes("relation") &&
      error.message?.includes("does not exist")
    ) {
      return NextResponse.json(
        { error: "Table or column not found in database" },
        { status: 400 }
      );
    }

    if (error.message?.includes("syntax error")) {
      return NextResponse.json(
        { error: "Invalid SQL syntax generated" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process query" },
      { status: 500 }
    );
  }
}
