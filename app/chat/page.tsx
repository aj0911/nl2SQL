"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Database,
  ChevronDown,
  ChevronRight,
  Code,
  User,
  Bot,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  sql?: string;
  timestamp: Date;
}

interface Table {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState<Table[]>([]);
  const [selectedSql, setSelectedSql] = useState<string | null>(null);
  const [isSchemaOpen, setIsSchemaOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [writing, setWriting] = useState<"Thinking" | "Fetching Schema" | "Executing Query" | "Generating"
  >("Thinking");
  const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_API_URL,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    responseMimeType: "application/json",
  };
  const model = "gemini-2.5-flash";

  useEffect(() => {
    // Check session and load schema
    const initializeChat = async () => {
      try {
        const _db = localStorage.getItem("_db");
        if (!_db) {
          router.push("/connect");
          return;
        }
        setWriting("Fetching Schema");
        setIsLoading(true);
        const schemaResponse = await fetch("/api/schema", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: _db,
        });

        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          setSchema(schemaData.tables || []);
        }

        // Load chat history from localStorage
        const savedMessages = localStorage.getItem("chat-history");
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } catch (error) {
        toast({
          title: "Initialization Error",
          description: "Failed to initialize chat interface",
          variant: "destructive",
        });
        router.push("/connect");
      } finally {
        setIsLoading(false);
        setWriting("Thinking");
      }
    };

    initializeChat();
  }, [router, toast]);

  useEffect(() => {
    // Save messages to localStorage
    if (messages.length > 0) {
      localStorage.setItem("chat-history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const _db = localStorage.getItem("_db");

      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: _db,
      });

      const data = await response.json();

      setWriting("Fetching Schema");

      if (response.ok) {
        // recieved datascheme
        const schemaContext = data.data.schemaContext;

        //contents
        const contents = [
          {
            role: "user",
            parts: [
              {
                text: `
                  You are a PostgreSQL query generator that must produce syntactically correct queries.
                  Schema Context:
                  ${schemaContext}

                  User Request:
                  "${userMessage.content}"

                  MANDATORY REQUIREMENTS:
                  1. **Quote ALL Identifiers**: Wrap every table and column name in double quotes
                    - Table: "user", "orders", "products" 
                    - Columns: "Name", "userId", "created_at"
                  2. **Exact Schema Match**: Only use tables/columns that exist in the provided schema
                  3. **PostgreSQL Syntax**: Use proper PostgreSQL syntax and lowercase keywords
                  4. **No Assumptions**: Don't assume column types, constraints, or relationships not in schema

                  RESPONSE FORMAT:
                  Return only this JSON structure:
                  { "query": "your-sql-query-here" }

                  QUERY PATTERNS:
                  - SELECT: SELECT "column1", "column2" FROM "table_name" WHERE "condition_column" = 'value'
                  - INSERT: INSERT INTO "table_name" ("col1", "col2") VALUES ('val1', 'val2')
                  - UPDATE: UPDATE "table_name" SET "column" = 'value' WHERE "id" = 123
                  - DELETE: DELETE FROM "table_name" WHERE "column" = 'value'

                  ERROR PREVENTION:
                  - Always quote identifiers (prevents reserved word conflicts)
                  - Use single quotes for string literals
                  - Match exact case from schema
                  - No backticks (\`) - use double quotes (")
                  - No square brackets ([]) - use double quotes (")

                  VALIDATION CHECKLIST:
                  ✓ All table names quoted
                  ✓ All column names quoted  
                  ✓ String values in single quotes
                  ✓ Keywords in lowercase
                  ✓ Syntax matches PostgreSQL standard
                  ✓ Only uses schema-defined tables/columns
                `,
              },
            ],
          },
        ];

        const response = await ai.models.generateContent({
          model,
          config,
          contents,
        });

        if (
          response.candidates &&
          response.candidates[0].content &&
          response.candidates[0].content.parts
        ) {
          setWriting("Executing Query");
          const res = JSON.parse(
            response.candidates[0].content.parts[0].text ||
              '{query: "No query is passed, it just a normal information"}'
          );
          const params = new URLSearchParams({
            query: res.query || "No Query Get",
            ...JSON.parse(_db || "{}"),
          });
          const results = await fetch(`/api/query?${params.toString()}`);
          const resp = await results.json();

          setWriting("Generating");

          const aiModelResponse = await ai.models.generateContent({
            model,
            config: {
              thinkingConfig: {
                thinkingBudget: -1,
              },
              responseMimeType: "text/plain",
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Given the PostgreSQL query: "${
                      res.query
                    }" and its result: ${JSON.stringify(resp)}
                    Generate a human-like response in conversational English that explains the results. Be concise and natural, like you're explaining to a colleague.

                    Examples:
                    - "I found 25 customers in the database"
                    - "Your total revenue for 2023 is $45,230"
                    - "There are 3 products with low inventory"

                    Keep it under 100 words and be specific about the numbers/data found.
                    `,
                  },
                ],
              },
            ],
          });

          if (
            aiModelResponse.candidates &&
            aiModelResponse.candidates[0].content &&
            aiModelResponse.candidates[0].content.parts
          ) {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "ai",
              content:
                aiModelResponse.candidates[0].content.parts[0].text ||
                "Sorry!! not able to generate the message",
              sql: res.query,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
          }
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `Error: ${data.error || "Failed to process query"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Error: Failed to send message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setWriting("Thinking");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">NL2SQL Chat</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("chat-history");
                localStorage.removeItem("_db");
                router.push("/connect");
              }}
            >
              Disconnect
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
          <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
            {/* Chat Section */}
            <div className="lg:col-span-3 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5" />
                    <span>Chat with your Database</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex ${
                              message.type === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.type === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                              }`}
                              onClick={() =>
                                message.sql && setSelectedSql(message.sql)
                              }
                            >
                              <div className="flex items-start space-x-2">
                                {message.type === "user" ? (
                                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm">{message.content}</p>
                                  {message.sql && (
                                    <div className="mt-2 flex items-center text-xs opacity-70">
                                      <Code className="w-3 h-3 mr-1" />
                                      Click to view SQL
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">{writing}...</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask a question about your database..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schema Section */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <Collapsible open={isSchemaOpen} onOpenChange={setIsSchemaOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4" />
                          <span>Database Schema</span>
                        </div>
                        {isSchemaOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <ScrollArea className="h-[calc(100vh-300px)]">
                        <div className="space-y-4">
                          {schema.map((table) => (
                            <motion.div
                              key={table.name}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border rounded-lg p-3"
                            >
                              <h4 className="font-medium text-sm mb-2">
                                {table.name}
                              </h4>
                              <div className="space-y-1">
                                {table.columns.map((column) => (
                                  <div
                                    key={column.name}
                                    className="text-xs flex justify-between items-center"
                                  >
                                    <span className="font-mono">
                                      {column.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {column.type}
                                      {!column.nullable && " *"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                          {schema.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm">
                              No tables found
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>

          {/* SQL Dialog */}
          <Dialog
            open={!!selectedSql}
            onOpenChange={() => setSelectedSql(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Generated SQL Query</span>
                </DialogTitle>
              </DialogHeader>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {selectedSql}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
}
