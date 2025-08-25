"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Eye, EyeOff, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface ConnectionForm {
  host: string;
  user: string;
  password: string;
  database: string;
  port: string;
}

export default function ConnectPage() {
  const [form, setForm] = useState<ConnectionForm>({
    host: "ep-old-river-adctltyl-pooler.c-2.us-east-1.aws.neon.tech",
    user: "neondb_owner",
    password: "npg_b3dhOXi1QcAs",
    database: "neondb",
    port: "5432",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestSuccessfull, setIsTestSuccessfull] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (field: keyof ConnectionForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ["host", "user", "password", "database", "port"];
    for (const field of required) {
      if (!form[field as keyof ConnectionForm].trim()) {
        toast({
          title: "Validation Error",
          description: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } is required`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const testConnection = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });

      const data = await response.json();

      if (response.ok) {
        // store in localstorage
        setIsTestSuccessfull(true);

        toast({
          title: "Connection Successful",
          description: "Database connection established successfully!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(`_db`, JSON.stringify(data.data));
        router.push("/chat");
        toast({
          title: "Saved",
          description: "Successfully saved the database credentials!",
        });
        router.push("/chat");
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center"
            >
              <Database className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              Database Connection
            </CardTitle>
            <CardDescription>
              Enter your PostgreSQL database credentials to connect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={form.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="user">User</Label>
              <Input
                id="user"
                placeholder="postgres"
                value={form.user}
                onChange={(e) => handleInputChange("user", e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                placeholder="mydb"
                value={form.database}
                onChange={(e) => handleInputChange("database", e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="5432"
                value={form.port}
                onChange={(e) => handleInputChange("port", e.target.value)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-3 pt-4"
            >
              <Button
                onClick={testConnection}
                disabled={isLoading || isTestSuccessfull}
                variant="outline"
                className={`w-full bg-transparent flex items-center justify-center transition-colors ${
                  isTestSuccessfull
                    ? "border-green-600 text-white bg-green-800 hover:bg-green-600"
                    : ""
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Test Connection
                {isTestSuccessfull && <Check className="ml-2 text-white" />}
              </Button>

              {isTestSuccessfull && (
                <Button
                  onClick={connect}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Connect & Continue
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
