import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { extractKpisJob } from "@/lib/inngest/extract-kpis";

export const { GET, POST, PUT } = serve({ client: inngest, functions: [extractKpisJob] });
